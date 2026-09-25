const { createClient } = require('@supabase/supabase-js');

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
    // On ne fait jamais confiance à un id envoye par le client pour une suppression :
    // on verifie l'identite a partir du token de session de l'utilisateur connecte.
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Session invalide ou expirée.' }) };
    }
    const userId = userData.user.id;

    await supabaseAdmin.from('vehicles').delete().eq('user_id', userId);
    await supabaseAdmin.from('planning_tasks').delete().eq('user_id', userId);

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Delete account error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ message: err.message || 'Erreur lors de la suppression du compte.' }) };
  }
};
