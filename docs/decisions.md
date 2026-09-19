# Décisions techniques — Trakoto

Choix structurants constatés dans le code et l'historique git, avec la raison connue quand elle est identifiable. Ne pas "corriger" ces points sans en avoir discuté — ce sont des choix assumés, pas des oublis.

## Un fichier HTML monolithique par page, sans build

`app.html`, `landing.html`, `payment.html` sont chacun un fichier HTML autonome avec CSS/JS inline, sans bundler ni framework.
**Pourquoi** : déploiement direct sur Netlify sans étape de build front, itération rapide sur un seul fichier.
**Comment l'appliquer** : ne pas proposer de migration vers un framework (React, Vue...) ou un bundler sans demande explicite — voir la règle anti over-engineering dans `CLAUDE.md`.

## `localStorage` en source de vérité, Supabase en synchro best-effort

Les données (`vehicles`, `planning`, `prestataires`, `orgEntries`) sont lues/écrites d'abord dans `localStorage`. La synchro vers Supabase (`syncToSupabase()`, `syncOrgToSupabase()`) se fait ensuite, sans résolution de conflit ni file d'attente de retry.
**Pourquoi** : simplicité, l'app reste utilisable même sans connexion/session Supabase active.
**Comment l'appliquer** : toute nouvelle fonctionnalité de données doit suivre ce même pattern (écrire en local d'abord) plutôt que de dépendre d'un aller-retour réseau synchrone.

## Table `vehicles` réutilisée comme stockage générique pour l'organisation

Les données "organisation" (`prestataires`, `orgEntries`) sont stockées dans la table Supabase `vehicles` sous un id `<user_id>_organisation`, alors qu'elles n'ont rien à voir avec des véhicules. Il n'y a pas de table `organisation` dédiée.
**Pourquoi** : évite une migration de schéma Supabase pour une fonctionnalité ajoutée après coup ; les deux tables (`vehicles`, `planning_tasks`) sont utilisées comme un simple stockage clé-valeur JSON (`{id, user_id, data}`), pas comme des tables relationnelles.
**Comment l'appliquer** : ne pas "nettoyer" ça en créant une vraie table `organisation` sans migration explicite des données existantes des utilisateurs — ça casserait leur lecture actuelle. Si une vraie table dédiée est un jour souhaitée, il faut un script de migration, pas juste changer le nom de table dans le code.

## `openAnchoredMenu()` comme pattern unique pour les menus contextuels

Le commit `102dc5f` ("Audit + nettoyage app.html") a supprimé un ancien popover statut dupliqué et une fonction morte (`_ntaskModalBodyOLD`), et migré le popover de recherche du Planning vers `openAnchoredMenu()` pour éviter un bug d'`overflow:hidden` déjà rencontré ailleurs.
**Pourquoi** : deux implémentations de menu contextuel différentes ont produit le même bug de recadrage (`overflow:hidden` d'un parent qui coupe le menu) à deux endroits distincts.
**Comment l'appliquer** : tout nouveau menu/popover contextuel doit utiliser `openAnchoredMenu(anchorEl, itemsHtml)`, jamais un `position:absolute` custom recréé à la main.

## Breakpoint desktop unique à 900px

Un seul vrai breakpoint structurant (`@media (min-width: 900px)`) sépare mobile et desktop ; `768px`/`480px` ne servent qu'à des ajustements fins côté mobile, pas à un mode "tablette" séparé.
**Pourquoi** : demande explicite de l'utilisateur de garder le mobile intact et de traiter le desktop comme un contexte à part entière, pas une simple adaptation responsive progressive.
**Comment l'appliquer** : toute nouvelle règle "desktop" va dans la media query 900px ; ne pas créer de breakpoint intermédiaire sans demande explicite.

## PWA partielle, assumée en l'état

L'app a des meta tags PWA (`apple-mobile-web-app-capable`, icône générée par `<canvas>`) mais pas de `manifest.json` ni de service worker : pas d'installabilité réelle ni de mode offline.
**Constat** : ceci n'est pas documenté comme un choix explicite dans l'historique — c'est l'état actuel du code, à traiter comme "PWA non finalisée" plutôt que comme un bug, sauf si l'utilisateur demande une vraie installabilité.
