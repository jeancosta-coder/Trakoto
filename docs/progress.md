# État d'avancement — Trakoto

Dernière mise à jour : 2026-09-19. Ce fichier est un instantané, pas un journal en temps réel — croiser avec `git log` et `git status` pour l'état exact au moment présent.

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

- Fiche détail véhicule : fusion Notes + Infos véhicule en un bloc unique, édition verrouillée tant que le pinceau n'est pas activé, sections labellisées, hiérarchie visuelle renforcée (infos principales en lignes verticales, plus grandes que le reste).
- Zone Notes : cadre visible, hauteur auto-adaptative au contenu, placeholder plus clair.
- Parc mobile : cartes remplacées par des lignes pleine largeur type Leboncoin (photo à gauche, infos à droite).
- Landing page : plusieurs refontes (showcase, FAQ, animations au scroll, réorganisation des sections pour la conversion).
- Nettoyage `app.html` (commit `102dc5f`) : suppression de code mort (popover statut dupliqué, fonction `_ntaskModalBodyOLD`), migration des popovers vers `openAnchoredMenu()`.

## En cours (non terminé)

- **Adaptation desktop de la fiche détail véhicule** : le premier essai (réduction des tailles de police) a été jugé inadapté par l'utilisateur ("pas ergonomique, pas esthétique"). Une deuxième version restructure vraiment la mise en page en grille 3 colonnes (`#detail-tab-inforight .dt-info-card { display:grid; grid-template-columns: repeat(3,1fr); }`) — **présente dans `app.html` mais non commitée au moment de la rédaction**, avec un bug connu : les labels/valeurs longs (ex. "KILOMÉTRAGE" / "42 300 km") débordent de leur colonne de grille. Correctif identifié mais pas encore appliqué : `min-width: 0` sur les cellules de la grille + `overflow-wrap: break-word` sur labels/valeurs.
  → Avant de reprendre : vérifier l'état réel avec `git diff app.html` (ne pas supposer que cet état est toujours celui décrit ici).

## Prochaine étape demandée

- **Planning** : ajouter une transition de type glissement (slide), façon Apple Calendar, lors du changement de page/date affichée. Pas encore commencé — fonctions concernées probables : `renderPlanning()`, `renderWeekView()`, `renderMonthView()`, et la navigation via `currentDisplayDate`.

## Notes pour reprendre le travail

- Toujours vérifier `git status`/`git diff` avant de supposer l'état du fichier `app.html` — plusieurs sessions de travail peuvent se succéder avec des changements non commités.
- Pas de tests automatisés : toute vérification se fait manuellement (preview locale via `.claude/launch.json`, ou test live sur le compte Supabase de l'utilisateur).
