# PokéRadar 63 — V11 locale

Premier lot : application statique personnelle avec six rubriques, recherche, édition, suppression, export et import V11.

Ce commit n'est pas le transfert intégral de l'archive de 40 fichiers : les tests et guides complémentaires ne sont pas encore ajoutés. Ces fichiers ne sont pas une copie à l'identique de l'archive précédente et devront être vérifiés après ajout.

## Limites
Aucun serveur, compte, prix ou stock vérifié, veille, scan, photos, notification distante ou synchronisation. Alertes préparées = aide-mémoire uniquement. Données locales non chiffrées par l'application. Redémarrage hors ligne non garanti. Pas de garantie zéro bug. Pas encore testé dans Safari sur iPad.

## Hébergement
Importer le dépôt dans Vercel comme site statique, preset Other, sans compilation, index.html à la racine. Aucune variable d'environnement nécessaire. Aucun Supabase à configurer pour ce carnet. Ne pas ouvrir index.html directement dans Fichiers : utiliser un serveur HTTP ou l'adresse HTTPS déployée.

## Vérification manuelle obligatoire
Ajouter une observation avec quantité zéro et prix zéro, recharger, modifier, exporter, supprimer puis importer. Vérifier absence de doublon au second import, refus d'une sauvegarde invalide, affichage littéral du texte HTML et protection contre les changements d'un autre onglet. Exporter avant toute suppression.
