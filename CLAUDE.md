# Trakoto (Autotrack) — Contexte pour Claude Code

CRM pour marchands indépendants de véhicules d'occasion (VO). Un marchand y suit son stock du bout en bout : achat d'un véhicule → remise en état (coûts, prestataires) → mise en vente → vente → marge réalisée. Les 5 vues (`docs/architecture.md`) couvrent chaque étape : Parc (stock), Planning (tâches/rdv), Organisation (suivi prestataires), Dashboard (marge, seuil de rentabilité), Compte.
Déployé sur Netlify. Utilisateur : Jean Costa, non-développeur, écrit en français direct. Voir `docs/` pour le détail.

Note nommage : le produit s'appelle "Trakoto" (titre de l'app), le repo/dossier s'appelle `autotrack` — même projet, deux noms.

## Lancer en local / déployer

- Preview locale : serveur `.claude/launch.json` (config `trakoto`, port 3456) — pas de build à lancer, sert les fichiers statiques tels quels.
- Déploiement : tout `git push` sur `main` déploie directement en production via Netlify (pas de branche de preview, pas de review). Un commit cassé sur `app.html`/`payment.html` est visible immédiatement par l'utilisateur final.

## Stack (pas de build, pas de framework)

- **Frontend** : pages HTML statiques, tout le CSS/JS inline dans chaque fichier. Aucun bundler, aucun `package.json` racine, aucune dépendance npm côté front.
- **Fichiers principaux** :
  - `app.html` — l'application CRM (~5900 lignes). Le cœur du projet.
  - `landing.html` — site vitrine marketing.
  - `payment.html` — inscription + paiement Stripe.
  - `cgv.html`, `confidentialite.html`, `mentions-legales.html` — pages légales statiques, rarement touchées.
- **Auth/BDD** : Supabase v2 (client CDN, `createClient` dans `app.html`).
- **Paiement** : Stripe (clé publique dans `payment.html`) + `netlify/functions/create-subscription.js` (Node, seul backend du projet).
- **Déploiement** : Netlify. Routing dans `_redirects` (`/` → landing, `/app` → app, `/payment` → payment). Pas de CI/tests automatisés.

Détails techniques complets (structure interne d'`app.html`, vues, state, schéma Supabase) : voir [docs/architecture.md](docs/architecture.md).
Historique des choix techniques : voir [docs/decisions.md](docs/decisions.md).
État d'avancement / roadmap : voir [docs/progress.md](docs/progress.md).

## Conventions importantes

- **Desktop = `@media (min-width: 900px)` uniquement.** Toute modif "desktop" doit être scopée dans cette media query, avec `!important` si besoin d'override. Ne jamais modifier une règle en dehors de cette media query quand la demande est "sur desktop" (et inversement pour "mobile").
- **`position:fixed` interdit dans les modals sur desktop** : les boutons mobiles en `position:fixed` doivent être overridés en `position:static !important; width:100%` dans la media query desktop (un `fixed` dans un modal desktop sort du flux et disparaît).
- **Préfixes de classes CSS par feature** — ne pas en inventer de nouveaux sans raison : `.ntask-*` (planning/tâches), `.kpi-*`/`.dash-*` (dashboard), `.org-*` (kanban organisation), `.bft-*`/`.fin-*` (coûts/finances véhicule), `.dt-*`/`.vsg-*` (fiche détail véhicule), `.vc-*` (carte véhicule/parc).
- **Menus contextuels** : toujours utiliser `openAnchoredMenu(anchorEl, itemsHtml)` (déjà présent dans `app.html`). Ne pas recréer de popover custom — ça a déjà causé des bugs et du code mort par le passé (voir `docs/decisions.md`).
- **État global** : variables JS globales (`vehicles`, `planning`, `prestataires`, `orgEntries`, `sbUser`, `currentDisplayDate`, etc.), pas de store/framework. `localStorage` est la source de vérité immédiate, la synchro Supabase est best-effort en arrière-plan (`save()` → `syncToSupabase()`).

## Éviter l'over-engineering

- Ne pas introduire de build tool, de framework JS, de bundler ou de dépendance npm côté front : le projet est volontairement un fichier HTML statique par page.
- Ne pas créer d'abstraction (composants, helpers génériques) pour un cas d'usage unique. Trois lignes similaires valent mieux qu'une fausse généralisation.
- Ne pas scinder `app.html` en plusieurs fichiers/modules sans demande explicite — c'est un choix d'architecture assumé (déploiement simple, pas de build).
- Ne pas ajouter de gestion d'erreur/fallback pour des cas qui ne peuvent pas arriver (pas d'API externe non maîtrisée côté front à part Supabase/Stripe déjà gérés).

## Limiter les modifications aux fichiers pertinents

- Une demande "sur l'app" = `app.html` uniquement. Une demande "sur la landing" = `landing.html` uniquement. Ne pas toucher les autres fichiers HTML par précaution ou "au cas où".
- Avant d'éditer, localiser la fonction/section exacte par `grep`/recherche plutôt que de relire tout le fichier — `app.html` fait 373 Ko, le lire en entier à chaque tâche gaspille du contexte.
- Ne pas modifier les pages légales (`cgv.html`, `confidentialite.html`, `mentions-legales.html`) sauf demande explicite.

## Workflow de travail

1. Chercher la fonction/section concernée par grep avant de lire (ex. `grep -n "function renderPlanning" app.html`) plutôt que de charger tout le fichier.
2. Faire des modifications ciblées (Edit), pas de réécriture de blocs entiers non concernés.
3. Si la tâche est "desktop only" ou "mobile only", vérifier après coup que l'autre contexte n'a pas été touché (diff de la media query correspondante).
4. Committer et pousser à la fin de chaque tâche (`git add <fichiers> && git commit -m "..." && git push`) sauf demande contraire — l'utilisateur ne fait pas de git lui-même.
5. Réponses courtes en français, pas de récapitulatif long en fin de tâche : l'utilisateur voit le diff.
6. Mettre à jour `docs/progress.md` quand une fonctionnalité est terminée ou qu'une nouvelle tâche démarre.

## Garde-fous — zones sensibles (demander confirmation / grande prudence avant de toucher)

- **Finalisation de vente & verrouillage finance** (`isFinanceLocked`, `unlockFinanceForEdit`, `openFinalizeSaleModal`, `venteValidee` dans `app.html`) : logique métier qui verrouille les champs finance après une vente validée. Une régression ici peut fausser des données financières réelles.
- **Synchro localStorage ↔ Supabase** (`save()`, `syncToSupabase()`, `syncOrgToSupabase()`, `loadFromSupabase()` dans `app.html`) : pas de résolution de conflit, écrasement simple. Les données d'organisation (`prestataires`/`orgEntries`) sont stockées dans la table `vehicles` sous un id `_organisation` (bidouille assumée, voir `docs/decisions.md`) — ne pas "corriger" ça sans migration explicite, ça casserait les données existantes des utilisateurs.
- **Paiement Stripe** (`payment.html`, `netlify/functions/create-subscription.js`) : logique de paiement réel (essai 14 jours, clé publique `pk_live`). Toute modif doit être testée avant push, ne jamais committer de clé secrète. `STRIPE_SECRET_KEY` (`process.env`) est configurée côté dashboard Netlify, pas dans le repo — ne pas la chercher dans le code.
- **Auth Supabase** (`sb.auth.onAuthStateChange`, `getSession` dans `app.html`) : n'écoute que l'event `SIGNED_OUT` pour éviter une boucle infinie — ne pas ajouter d'autres listeners sans vérifier ce risque.
