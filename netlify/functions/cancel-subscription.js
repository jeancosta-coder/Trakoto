const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { resolveStripeCustomer } = require('./_stripe-customer');

const SUPABASE_URL = 'https://qfwbneqcnqmpwkyolxze.supabase.co';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let accessToken;
  try {
    ({ accessToken } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Corps de requête invalide.' }) };
  }
  if (!accessToken) {
    return { statusCode: 400, body: JSON.stringify({ message: 'accessToken est requis.' }) };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY manquante.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Configuration serveur incomplète.' }) };
  }
  const supabaseAdmin = createClient(SUPABASE_URL, serviceKey);

  try {
    const { error, customerId } = await resolveStripeCustomer(supabaseAdmin, stripe, accessToken);
    if (error) return { statusCode: error.statusCode, body: JSON.stringify({ message: error.message }) };
    if (!customerId) return { statusCode: 404, body: JSON.stringify({ message: 'Aucun abonnement trouvé.' }) };

    const active = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    const trialing = active.data.length === 0
      ? await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 })
      : active;
    if (trialing.data.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Aucun abonnement actif à résilier.' }) };
    }
    const sub = trialing.data[0];
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, currentPeriodEnd: updated.current_period_end })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ message: err.message || 'Erreur lors de la résiliation.' }) };
  }
};
