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
      return { statusCode: 200, body: JSON.stringify({ status: 'none' }) };
    }
    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 1 });
    if (subscriptions.data.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ status: 'none' }) };
    }
    const sub = subscriptions.data[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: sub.status, // trialing, active, canceled, past_due, ...
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: sub.current_period_end, // timestamp Unix (secondes)
        trialEnd: sub.trial_end
      })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ message: err.message || 'Erreur lors de la récupération du statut.' }) };
  }
};
