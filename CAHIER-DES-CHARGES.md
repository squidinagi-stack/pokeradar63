# CAHIER DES CHARGES — POKÉRADAR 63

Ce document est la référence du projet. Aucun livrable ne doit être présenté comme complet s’il ne couvre pas ces exigences.

## Règle principale

L’utilisateur n’est pas le fournisseur d’informations de l’application.

Le service doit découvrir, vérifier et actualiser les informations à partir des sources raccordées. Les messages de l’utilisateur peuvent aider exceptionnellement, mais le fonctionnement normal ne doit pas en dépendre.

## Périmètre produit

PokéRadar 63 est une application Pokémon TCG centrée sur le Puy-de-Dôme, avec un calendrier officiel automatisé, un radar de disponibilité, des magasins du 63, des notifications, une communauté, des photos, un scan, des prix, des analyses prudentes, des itinéraires, un profil, des éléments ludiques, un didacticiel, des sauvegardes, un fonctionnement hors ligne, la sécurité et un design soigné.

## Calendrier officiel automatisé

- Découvrir les références depuis les sources raccordées.
- Lire les pages officielles sans demander de dates à l’utilisateur.
- Extraire uniquement les formulations explicites de sortie.
- Conserver un trimestre comme trimestre, sans inventer de jour.
- Signaler les contradictions plutôt que choisir arbitrairement.
- Distinguer une annonce d’extension, un ETB, un coffret, un deck ou une autre variante.
- Conserver l’historique des changements de date ou de précision.
- Garder l’ancienne information visible en cas d’échec de relecture, avec avertissement.
- Afficher les sources, la dernière lecture réussie et les échecs.
- Fonctionner sans conversation ouverte, via une tâche programmée.
- Ne pas contourner les protections anti-robot.

## État réel — calendrier

Réalisé dans le commit c32bfaf :

- Collecteur limité aux pages officielles Pokémon FR.
- Découverte HTML depuis la galerie officielle.
- Extraction de dates explicites et de trimestres.
- Historique des changements.
- Page séparée /radar-auto/.
- Workflow quotidien à 05:23 UTC.
- 12 tests unitaires synthétiques.

## État des briques (30/10/2026)

- Calendrier : moteur installé, workflow exécuté ; dernière collecte bloquée par Incapsula (page pokemon.com). Correctif anti-blocage publié, accès réel à reconfirmer.
- Magasins du 63 : 15 boutiques réelles sourcées le 30/10/2026 (GameCash, Micromania Jaude/Brezet, Smyths, Cultura, King Jouet, Fnac, Leclerc + boutiques TCG indépendantes d'annuaire communautaire). Horaires uniquement pour sources officielles/agrégées. Aucun stock affirmé.
- Alertes locales : journal installé sur l'accueil, alimenté par les changements réels du calendrier (nouvelle annonce, report, conflit, source bloquée). Notifications navigateur à activer manuellement.
- Signalements (communauté, version locale) : page /signalements/ ouverte le 30/10/2026. Observation datée par magasin sourcé, état (en rayon, rupture, tirage au sort, vente décalée), prix et quantité optionnels, note, photo de preuve contrôlée, fraîcheur affichée (fraîche/récente/ancienne/périmée), filtres, suppression, export et import JSON validés (28 tests). Stockage strictement local : la synchronisation multi-appareils n'est PAS installée et c'est affiché.
- Design (30/10/2026, v0.7.0) : refonte claire et illustrée sur toutes les pages — thème lumineux (fond crème, rouge/blue/green PokéRadar), logo SVG original sur chaque page, radar animé sur l'accueil, icônes par fonction, carte schématique des zones sur Magasins, navigation unifiée (Accueil, Calendrier, Magasins, Signalements, Didacticiel).
- Didacticiel (30/10/2026) : page /tuto/ ouverte — 5 étapes illustrées en langage simple, vocabulaire (observation, fraîcheur, source, alerte, vérifié), bilan honnête de ce qui marche et de ce qui est en chantier.
- Bug corrigé : la CSP bloquait l'affichage des photos de preuve (img-src data:). Les photos de signalements s'affichent désormais.
- Prix/EV, itinéraires, profil/sauvegardes, scan, synchronisation multi-appareils : à construire.

Non encore validé ou réalisé :

- Première exécution réelle du workflow.
- Accessibilité réelle des pages depuis GitHub Actions.
- Redéploiement Vercel après le commit du bot.
- Reports publiés uniquement sur les réseaux sociaux.
- Couverture de toutes les formulations françaises possibles.
- Association automatique fiable entre une extension et tous ses coffrets.

## Radar de disponibilité

- Suivre les disponibilités et réassorts des sources autorisées.
- Distinguer disponibilité en ligne, en magasin et précommande.
- Ne jamais présenter une date de sortie comme une preuve de stock.
- Indiquer la fraîcheur de chaque donnée.

## Magasins du 63

- Répertoire des magasins du Puy-de-Dôme.
- Horaires, adresse, contact et itinéraire.
- Distinction claire entre information vérifiée et information non vérifiée.

## Notifications

- Alertes pour nouvelles sorties, changements de date et disponibilités suivies.
- Préférences par produit, zone et type d’événement.
- Aucune alerte inventée à partir d’une donnée incertaine.

## Communauté

- Reports utilisateurs avec preuve, date et statut de vérification.
- Modération et protection contre les faux signalements.
- Respect de la vie privée et pas de données personnelles inutiles.

## Photos, scan et prix

- Photos de cartes et produits.
- Scan ou recherche visuelle.
- Prix indicatifs avec source, date et avertissement.
- Pas de promesse de valeur de revente.

## Analyse EV et itinéraires

- Estimations prudentes, transparentes et datées.
- Itinéraires multi-magasins.
- Pas de garantie de stock ni de rentabilité.

## Profil, sauvegardes et hors ligne

- Profil utilisateur.
- Sauvegardes et restauration.
- Consultation hors ligne des données déjà chargées.
- Synchronisation fiable lorsque la connexion revient.

## Sécurité et qualité

- Aucune clé secrète dans le code.
- Permissions minimales.
- Sources et preuves visibles.
- Accessibilité clavier et mobile.
- Design distinctif, lisible et cohérent.
- Didacticiel intégré.

## Interdits

- Réduire le projet à un carnet, une page statique ou un simple calendrier.
- Prétendre qu’une fonction existe sans l’avoir installée et vérifiée.
- Inventer une date, un stock, un prix ou une source.
- Confondre publication, expédition, précommande, disponibilité et sortie.
- Faire dépendre le fonctionnement normal des messages de l’utilisateur.
