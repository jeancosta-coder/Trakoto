# État d'avancement — Trakoto

Dernière mise à jour : 2026-09-19 (soir). Ce fichier est un instantané, pas un journal en temps réel — croiser avec `git log` et `git status` pour l'état exact au moment présent.

## Fonctionnalités en place

- **Auth** : inscription/connexion via Supabase, écran de connexion, récupération de mot de passe.
- **Parc** (`#parc`) : liste des véhicules en stock, cartes avec statut/prix, filtre par statut.
- **Fiche détail véhicule** : bloc unifié Notes + Infos véhicule (édition gated par un bouton pinceau), sections Informations principales / Mécanique / Apparence / Administratif, onglets Détails/Finances/Clientèle, gestion des coûts HT/TTC, verrouillage des champs finance après validation de vente.
- **Planning** (`#planning`) : vues semaine/mois, création de tâches, rail des prochaines tâches.
- **Organisation** (`#organisation`) : kanban des prestataires/réparations.
- **Dashboard** (`#dashboard`) : KPIs, graphique seuil de rentabilité (Chart.js), tableau des ventes.
- **Compte** (`#compte`) : paramètres utilisateur.
- **Landing page** (`landing.html`) : vitrine marketing, démo interactive, showcase des fonctionnalités, FAQ.
- **Paiement** (`payment.html` + `netlify/functions/create-subscription.js`) : inscription avec essai gratuit 14 jours via Stripe.
- Pages légales (CGV, confidentialité, mentions légales).

## Terminé récemment (voir `git log` pour le détail exact)

- Desktop (`app.html`, scopé `@media (min-width: 900px)`) : refonte des onglets Détails/Finances/Client de la fiche véhicule — bloc unique par onglet (au lieu de plusieurs sous-blocs), titres de section en texte gras plus grand (pas de fond ni de trait), séparateurs style tableau entre les lignes d'une même section uniquement, bouton "Valider la vente" intégré en pilule dans le bloc Finances, onglet "Clientèle" renommé "Client".
- Planning : vraie transition de glissement façon iOS entre deux pages (l'ancienne sort pendant que la nouvelle entre), sur les flèches prev/next et le swipe mobile.
- Organisation : ajout d'une recherche de véhicule (icône loupe dans l'en-tête) qui bascule sur le bon prestataire et met en surbrillance la carte trouvée.
- Retrait du bandeau "Préconisations constructeur IA" (placeholder désactivé) et du bandeau d'en-tête desktop de la vue Compte.
- Fiche détail véhicule : fusion Notes + Infos véhicule en un bloc unique, édition verrouillée tant que le pinceau n'est pas activé, sections labellisées, hiérarchie visuelle renforcée (infos principales en lignes verticales, plus grandes que le reste).
- Zone Notes : cadre visible, hauteur auto-adaptative au contenu, placeholder plus clair.
- Parc mobile : cartes remplacées par des lignes pleine largeur type Leboncoin (photo à gauche, infos à droite).
- Landing page : plusieurs refontes (showcase, FAQ, animations au scroll, réorganisation des sections pour la conversion).
- Nettoyage `app.html` (commit `102dc5f`) : suppression de code mort (popover statut dupliqué, fonction `_ntaskModalBodyOLD`), migration des popovers vers `openAnchoredMenu()`.

## En cours (non terminé)

- **Vue Compte desktop** : ajout d'un bloc "Paramètres" prévu (marge cible par défaut, numérotation automatique des N° de VO, export CSV du parc). Pas encore commencé.

## Prochaine étape demandée (mise de côté pour plus tard, à la demande de l'utilisateur)

- **Suppression de compte** (obligation RGPD) : nécessite une nouvelle fonction Netlify avec la clé service role Supabase (impossible depuis le front avec la clé publique) pour supprimer l'utilisateur dans `auth.users` en plus de ses données.
- **Résiliation d'abonnement** : à relier soit à un lien vers le Customer Portal Stripe, soit à une nouvelle fonction backend — à clarifier avec l'utilisateur avant de commencer (zone sensible, voir garde-fous Stripe dans `CLAUDE.md`).

## Notes pour reprendre le travail

- Toujours vérifier `git status`/`git diff` avant de supposer l'état du fichier `app.html` — plusieurs sessions de travail peuvent se succéder avec des changements non commités.
- Pas de tests automatisés : toute vérification se fait manuellement (preview locale via `.claude/launch.json`, ou test live sur le compte Supabase de l'utilisateur).
