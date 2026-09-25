// Helper partage : retrouve le customer Stripe d'un utilisateur Supabase authentifie.
// Priorite au stripe_customer_id stocke dans user_metadata (fiable, pose a la creation de l'abonnement).
// Fallback sur une recherche par email pour les comptes crees avant cette migration, avec backfill
// du user_metadata pour ne plus jamais avoir a refaire cette recherche ensuite.

async function resolveStripeCustomer(supabaseAdmin, stripe, accessToken) {
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return { error: { statusCode: 401, message: 'Session invalide ou expirée.' } };
  }
  const user = userData.user;
  let customerId = user.user_metadata?.stripe_customer_id;

  if (!customerId && user.email) {
    const found = await stripe.customers.list({ email: user.email, limit: 1 });
    if (found.data.length > 0) {
      customerId = found.data[0].id;
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, stripe_customer_id: customerId } });
      } catch (e) {
        console.error('Backfill stripe_customer_id échoué:', e.message);
      }
    }
  }

  return { user, customerId };
}

module.exports = { resolveStripeCustomer };
