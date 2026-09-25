const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfwbneqcnqmpwkyolxze.supabase.co';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let email, paymentMethodId, priceId, skipTrial, userId;
  try {
    ({ email, paymentMethodId, priceId, skipTrial, userId } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Corps de requête invalide.' }) };
  }

  if (!email || !paymentMethodId || !priceId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'email, paymentMethodId et priceId sont requis.' })
    };
  }

  try {
    // 1. Créer ou récupérer le customer Stripe
    const existing = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    // 2. Attacher le paymentMethod au customer (idempotent: ignore si déjà attaché)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    } catch (attachErr) {
      if (attachErr.code !== 'resource_already_exists') throw attachErr;
    }

    // 3. Définir ce paymentMethod comme défaut de facturation
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // 4. Créer la subscription (avec 14 jours d'essai, sauf si l'utilisateur choisit de payer immédiatement)
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      ...(skipTrial ? {} : { trial_period_days: 14 }),
      default_payment_method: paymentMethodId,
      payment_settings: { payment_method_types: ['card'], save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    // 5. Relier le customer Stripe au compte Supabase, pour ne plus jamais avoir a le retrouver par email ensuite.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (userId && serviceKey) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, serviceKey);
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { stripe_customer_id: customer.id } });
      } catch (linkErr) {
        // Ne bloque pas la creation du compte/abonnement si cette etape echoue : le fallback par email prend le relais.
        console.error('Impossible de lier le customer Stripe au compte Supabase:', linkErr.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, customerId: customer.id })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: err.message || 'Erreur lors de la création de la subscription.' })
    };
  }
};
