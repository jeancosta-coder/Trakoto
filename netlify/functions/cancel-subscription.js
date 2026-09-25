const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Corps de requête invalide.' }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ message: 'email est requis.' }) };
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Aucun abonnement trouvé pour cet email.' }) };
    }
    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
    const trialing = subscriptions.data.length === 0
      ? await stripe.subscriptions.list({ customer: customer.id, status: 'trialing', limit: 1 })
      : subscriptions;
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
