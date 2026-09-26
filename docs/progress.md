# État d'avancement — Trakoto

Dernière mise à jour : 2026-09-26. Ce fichier est un instantané, pas un journal en temps réel — croiser avec `git log` et `git status` pour l'état exact au moment présent.

## Fonctionnalités en place

- **Auth** : inscription/connexion via Supabase, écran de connexion, récupération de mot de passe.
- **Parc** (`#parc`) : liste des véhicules en stock, cartes avec statut/prix, filtre par statut.
- **Fiche détail véhicule** : bloc unifié Notes + Infos véhicule (édition gated par un bouton pinceau), sections Informations principales / Mécanique / Apparence / Administratif, onglets Détails/Transaction/Client, gestion des coûts HT/TTC (chaque frais a sa propre date + n° de facture), verrouillage des champs finance après validation de vente, régime de TVA + n° facture achat/vente par véhicule (comptabilité découplée de la validation commerciale).
- **Planning** (`#planning`) : vues semaine/mois, création de tâches, rail des prochaines tâches, transition de glissement type iOS entre pages.
- **Organisation** (`#organisation`) : kanban des prestataires/réparations, recherche de véhicule qui bascule sur le bon prestataire.
- **Dashboard** (`#dashboard`) : KPIs, graphique seuil de rentabilité (Chart.js), tableau des ventes.
- **Finance** (`#finance`, desktop uniquement) : vue comptable par période (mois/trimestre/année/tout), KPI (CA, coût véhicules, marge, charges, résultat, TVA à payer), charges de structure (ponctuelles + récurrentes), journal chronologique des opérations (achat/frais/vente datés indépendamment de la vente commerciale), export CSV/PDF avec récap TVA collectée/déductible/à payer pour l'expert-comptable.
- **Compte** (`#compte`) : profil utilisateur, statut d'abonnement (badge + détail), résiliation d'abonnement, bloc Paramètres (marge cible par défaut, numérotation auto des N° de VO, régime TVA par défaut, export CSV du parc, suppression de compte).
- **Landing page** (`landing.html`) : vitrine marketing, démo interactive, showcase des fonctionnalités, FAQ.
- **Paiement** (`payment.html` + `netlify/functions/create-subscription.js`) : inscription avec essai gratuit 14 jours via Stripe.
- Pages légales (CGV, confidentialité, mentions légales).

## Terminé récemment (voir `git log` pour le détail exact)

- **Finance — journal comptable** (commit `a3582fb`) : `finComputeSummary()` calcule TVA collectée (marge/classique), TVA déductible (frais avec TVA) et TVA à payer ; KPI recablés (corrige un bug d'affichage `undefined`) ; la liste "véhicules vendus" devient un vrai journal chronologique (achat/frais/vente datés) ; exports CSV/PDF structurés avec récap TVA.
- **Finance — dissociation comptabilité / vente commerciale** (commit `98ddf67`) : chaque frais a désormais sa propre date + n° de facture (`openFraisModal`/`commitFrais`), la vue Finance devient un grand livre chronologique indépendant du statut `venteValidee`.
- **Abonnement** : `get-subscription-status.js` (badge statut dans Compte), `cancel-subscription.js` (résiliation en fin de période), `delete-account.js` (suppression compte RGPD : résilie Stripe immédiatement + supprime les données Supabase + `auth.admin.deleteUser`). Toutes basées sur `_stripe-customer.js` (résolution fiable du customer Stripe via `stripe_customer_id` en `user_metadata`, avec fallback email + backfill).
- Vue Compte scindée : Compte (profil, abonnement) + Paramètres (mollette) contenant marge cible, numérotation VO, régime TVA par défaut, export CSV, suppression de compte.
- Desktop (`app.html`, scopé `@media (min-width: 900px)`) : refonte des onglets Détails/Transaction/Client de la fiche véhicule — bloc unique par onglet, titres de section en texte gras plus grand, séparateurs style tableau, bouton "Valider la vente" intégré en pilule dans le bloc Finances.
- Planning : transition de glissement type iOS entre deux pages, sur flèches prev/next et swipe mobile.
- Organisation : recherche de véhicule (icône loupe) qui bascule sur le bon prestataire et met en surbrillance la carte trouvée.
- Modal d'ajout de véhicule : refonte visuelle desktop (bordures, espacements) ; correction d'un bug d'affichage au chargement (`display:flex !important` en CSS écrasait le `display:none` du JS).
- Fiche détail véhicule : fusion Notes + Infos véhicule en un bloc unique, édition verrouillée tant que le pinceau n'est pas activé.
- Parc mobile : cartes remplacées par des lignes pleine largeur type Leboncoin.
- Landing page : plusieurs refontes (showcase, FAQ, animations au scroll, réorganisation pour la conversion).

## En cours / à finaliser

- **Aucun développement en cours.** Le blocage restant est une action utilisateur, pas du code : voir ci-dessous.

## ⚠️ Action utilisateur requise (bloquant en production)

- **`SUPABASE_SERVICE_ROLE_KEY` manquante sur Netlify** : `cancel-subscription.js` et `delete-account.js` renvoient une erreur 500 tant que cette variable d'environnement n'est pas ajoutée dans le dashboard Netlify (Site settings → Environment variables). Cette clé ne doit **jamais** être commitée dans le repo — uniquement côté Netlify. Sans elle, la résiliation d'abonnement et la suppression de compte sont cassées en prod.

## Idées non retenues / mises de côté

- Champ "type de vendeur" (particulier/pro) sur l'achat pour pré-remplir automatiquement le régime de TVA par véhicule : jugé non nécessaire — le régime par défaut (`financeData.vatDefault`, réglable dans Paramètres) pré-remplit déjà chaque véhicule, et le marchand peut l'ajuster ponctuellement dans l'onglet Transaction.

## Comptabilité — mis en pause à la demande de l'utilisateur (2026-09-26)

L'utilisateur souhaite finaliser le reste de l'app d'abord et revenir sur la comptabilité plus tard. Ne pas reprendre ces points sans demande explicite. Repartir de cette liste quand le sujet reviendra :

- **Bug d'incohérence CA/coût/marge identifié, non corrigé** : dans `finComputeSummary()` (app.html), le KPI "Coût des véhicules" agrège tous les achats/frais **datés** dans la période choisie (n'importe quel véhicule, vendu ou non), alors que "Marge véhicules" prend le coût **total** des véhicules **vendus** dans la période (peu importe la date de leurs frais). Résultat : `CA − Coût ≠ Marge` affichée sur une période donnée dès qu'il y a un décalage entre achats et ventes (ex. véhicules achetés en mars mais vendus en janvier, ou l'inverse). Un comptable verra l'incohérence immédiatement.
- **Infos manquantes dans l'export comptable** : nom de l'acheteur/vendeur, VIN/immatriculation du véhicule, mode de règlement (espèces/chèque/virement/crédit — pertinent pour le plafond légal espèces et le rapprochement bancaire), SIREN/SIRET de l'entreprise sur le PDF.
- **Pièces justificatives (fichiers) non attachables** : les n° de facture existent déjà partout (achat véhicule, vente véhicule, chaque frais, chaque charge — tous dans l'export), mais il n'y a aucun moyen d'attacher le document lui-même (photo/PDF de la facture, certificat de cession, attestation de vente/déclaration de cession). Chantier à part : nécessite un vrai stockage de fichiers (Supabase Storage), l'appli actuelle collant les photos en base64 dans la ligne JSON du véhicule (`_vehicles`), ce qui ne scale pas pour des pièces jointes en nombre.
- Hors scope app (à la charge du comptable) : charges sociales/salariales détaillées, immobilisations/amortissements, rapprochement bancaire réel, valorisation de stock de clôture d'exercice.

## Notes pour reprendre le travail

- Toujours vérifier `git status`/`git diff` avant de supposer l'état du fichier `app.html` — plusieurs sessions de travail peuvent se succéder avec des changements non commités.
- Pas de tests automatisés : toute vérification se fait manuellement (preview locale, ou test live sur le compte Supabase de l'utilisateur).
