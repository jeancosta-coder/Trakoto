# Architecture technique — Trakoto (Autotrack)

Vue technique détaillée. Pour les règles de travail, voir [CLAUDE.md](../CLAUDE.md) à la racine.

## Vue d'ensemble des fichiers

| Fichier | Rôle | Taille |
|---|---|---|
| `app.html` | Application CRM complète (le cœur du projet) | ~5900 lignes / 373 Ko |
| `landing.html` | Site vitrine marketing | ~2100 lignes / 114 Ko |
| `payment.html` | Inscription + paiement Stripe (essai 14 jours) | ~850 lignes / 25 Ko |
| `cgv.html`, `confidentialite.html`, `mentions-legales.html` | Pages légales statiques | petites, rarement modifiées |
| `netlify/functions/create-subscription.js` | Fonction serverless : crée/récupère le customer Stripe, attache le moyen de paiement, crée la subscription | seul backend du projet |
| `netlify/functions/package.json` | Dépendance `stripe` pour la fonction | — |
| `netlify.toml` | Config build Netlify (`functions = "netlify/functions"`, bundler esbuild) | — |
| `_redirects` | Routing Netlify : `/` → `landing.html`, `/app` → `app.html`, `/payment` → `payment.html` | — |

Pas de `package.json` racine, pas de build front, pas de tests automatisés, pas de CI.

## Structure interne d'`app.html`

Fichier monolithique avec plusieurs blocs `<style>`/`<script>` :

- `<style>` principal : lignes ~12–1515 (variables CSS, composants, layout)
- `<style>` complémentaire : lignes ~1516–1554
- `<style>` patch supplémentaire : lignes ~1665–1701
- `<body>` : ligne ~1637 → fin (markup des vues)
- Script CDN Supabase JS v2 (ligne ~11) et Chart.js 3.9.1 (ligne ~1555)
- Script génération d'icône PWA via `<canvas>` injecté en `data:` URL (lignes ~1556–1589) — pas de fichier icône statique
- Script thème clair/sombre appliqué avant rendu, anti-FOUC (lignes ~1590–1635)
- Script applicatif principal : lignes ~2547–5860 (le cœur métier, ~3300 lignes)

### Vues principales

Navigation pilotée en JS pur par `switchView(view)` (ligne ~3064), pas d'attributs `data-view`. Bascule `.view.active` / `display` et appelle le `render*` correspondant :

| Vue (id) | Fonction de rendu | Détail |
|---|---|---|
| `#parc` | `renderParc()` (~3486) | liste des véhicules en stock |
| `#planning` | `renderPlanning()` (~4372) | orchestre `renderMonthView(date)` (~4560) et `renderWeekView(date)` (~4594) selon `localStorage.at_planning_viewmode`; `renderPlanningRail()` (~4404) pour la liste des prochaines tâches |
| `#dashboard` | `renderDashboard()` (~5070) | KPIs, `renderBreakevenChart()` (~4999, Chart.js), `renderSalesTable()` (~5135) |
| `#organisation` | `renderOrganisation()` (~2681) | kanban prestataires, `renderOrgBoard()` (~2787) |
| `#compte` | `renderCompte()` (~3161) | paramètres du compte utilisateur |

### Fiche détail véhicule

- `openVehicleDetails(id)` (~3834) : ouvre le modal `#details`, initialise tous les champs.
- `switchDetailTab(tab)` (~4119) : gère les onglets Détails/Finances/Clientèle. Sur desktop, l'onglet "infos" est redirigé vers "finances" (colonne infos toujours visible à part).
- `editVsgField(cell, field)` (~3765) : édition inline d'un champ (attend un `.vsg-value` dans la cellule cliquée).
- `openVsgCarburantMenu`, `openVsgTransmissionMenu`, `openVsgBoolMenu` : ouvrent un menu via `openAnchoredMenu(anchorEl, itemsHtml)` (~5268), le pattern standard pour tout menu contextuel de l'app.
- `renderCostList(kind)` (~3883) : liste des coûts HT/TTC associés au véhicule.
- `isFinanceLocked` / `unlockFinanceForEdit` / `renderFinanceValidationState` (~4178–4372) : verrouillage des champs finance après validation de vente. **Zone sensible**, voir CLAUDE.md.

### Auth / Base de données

```js
const SUPABASE_URL = 'https://qfwbneqcnqmpwkyolxze.supabase.co';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); // ligne ~2575-2577
```

Session gérée en fin de fichier (~5829–5860) via `sb.auth.onAuthStateChange` (écoute uniquement `SIGNED_OUT`, pour éviter une boucle) et `sb.auth.getSession()`. Sur session valide → `loadFromSupabase().then(() => initApp())`, sinon `showLoginScreen()`. Gère aussi `PASSWORD_RECOVERY`.

**Schéma Supabase** — deux tables, utilisées comme un simple stockage clé-valeur JSON (pas de colonnes relationnelles) :

- `vehicles` : ligne `{id: userId+'_vehicles', user_id, data: <tableau JSON complet des véhicules>}`
- `vehicles` (même table, id différent) : `{id: userId+'_organisation', user_id, data: {prestataires, orgEntries}}` — voir `docs/decisions.md`
- `planning_tasks` : `{id: userId+'_planning', user_id, data: <tableau JSON des tâches>}`

Upsert systématique avec `onConflict: 'id'`.

### State management

Pas de framework/store. Variables JS globales déclarées en tête du script applicatif (~2578-2589) et dispersées ensuite :

- `sbUser`, `vehicles`, `planning`, `prestataires`, `orgEntries` — état métier principal
- `currentDetailVehicleId`, `currentParcFilter`, `financeUnlocked`, `currentDisplayDate`, `currentCalendarView`, `currentDashTab`, `planningIndex` — état UI/navigation

**Flux de données** : `localStorage` est la source de vérité immédiate (`at_vehicles`, `at_planning`, `at_prestataires`, `at_org_entries`), chargée au démarrage. Un objet `DataLayer` (~2600) encapsule le CRUD véhicules/planning avec une liste blanche de champs modifiables. `save()` (~2621) écrit en local puis déclenche `syncToSupabase()`/`syncOrgToSupabase()` en best-effort si `sbUser` existe — pas de gestion de conflit, écrasement simple.

## Conventions CSS

- **Breakpoint desktop officiel : `@media (min-width: 900px)`.** Autres breakpoints présents (ajustements mobiles fins uniquement) : `max-width: 899px`, `max-width: 768px`, `max-width: 480px`.
- **Préfixes de classes par feature** :
  - `.ntask-*` — planning / tâches (le plus utilisé)
  - `.kpi-*`, `.dash-*` — dashboard
  - `.org-*` — kanban organisation
  - `.bft-*`, `.fin-*` — coûts / finances véhicule
  - `.dt-*` — fiche détail véhicule
  - `.vsg-*` — champs éditables inline de la fiche véhicule ("vehicle spec grid")
  - `.vc-*` — carte véhicule (vue Parc)

## Landing / Payment / Légal

- `landing.html` : page marketing autonome, mêmes variables CSS de base (`--bg`, `--text`, etc.) que l'app pour cohérence visuelle, mais fichier totalement indépendant (pas de logique métier partagée avec `app.html`).
- `payment.html` : formulaire d'inscription + Stripe Elements. Clé publique Stripe (`pk_live_...`) en dur dans le fichier (normal, c'est une clé publiable côté client). Appelle `netlify/functions/create-subscription.js` pour créer l'abonnement (essai 14 jours par défaut, sauf `skipTrial`).
- Pages légales : HTML statique simple, pas de logique JS notable.

## PWA (partielle)

Meta tags PWA présents (`theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`), mais **pas de `manifest.json` ni de service worker** dans le projet. L'icône est générée dynamiquement via `<canvas>` et injectée en `data:` URL — pas d'assets icône statiques, pas de vraie installabilité/offline PWA malgré le nom.
