# Rapport de tests EduSmart

## Contrôles automatisés

| Contrôle | Commande | Résultat attendu |
|---|---|---|
| Moteur de recommandation | `npm test` dans `recommendation-service` | 3 tests réussis |
| Syntaxe du moteur | `npm run check` | aucun échec |
| Web | `npm run build` dans `Frontend/student-web` | bundle produit |
| Mobile | `npx expo export --platform web` | bundle produit |
| Docker | `docker compose config --quiet` | configuration valide |
| Kubernetes | `kubectl kustomize k8s/base --load-restrictor LoadRestrictionsNone` | manifeste produit |

La CI exécute automatiquement ces familles de contrôles à chaque push et pull
request. Pour les microservices sans tests métier, elle valide actuellement la
syntaxe de tous les fichiers JavaScript. Des tests d’intégration avec bases
éphémères restent recommandés avant une mise en production.

## Recette manuelle

1. Inscrire un étudiant et un formateur.
2. Créer, publier puis consulter un cours.
3. Accorder/acheter l’accès au cours avec l’étudiant.
4. Ouvrir « Mes cours » sur Web et mobile.
5. Terminer une ressource et vérifier le pourcentage.
6. Passer un quiz et vérifier le résultat.
7. Ouvrir « Pour vous » et vérifier score et justification.
8. Créer un message de forum et un commentaire.
9. Vérifier les tableaux de bord formateur et administrateur.

## Critères d’acceptation

- aucune route protégée sans JWT valide ;
- aucun cours non publié dans le catalogue ;
- progression persistante après reconnexion ;
- cours déjà suivi absent des recommandations ;
- secrets différents des valeurs de démonstration avant déploiement.
