# Modèle de recommandation EduSmart

## Approche

Le moteur utilise une stratégie hybride explicable basée sur le contenu, le
profil et les performances. Cette approche fonctionne sans volume historique
important et constitue une base évolutive vers le filtrage collaboratif.

## Signaux utilisés

- niveau déclaré de l’étudiant ;
- dernier résultat de quiz ;
- intérêts, compétences, matières préférées et objectifs ;
- catégorie, niveau, titre et tags du cours ;
- note moyenne du cours ;
- cours déjà suivis, qui sont exclus.

Le score initial est de 35. Une correspondance de niveau ajoute 35 points,
chaque préférence correspondante ajoute 8 points (maximum 24), et une bonne
note ajoute jusqu’à 10 points. Le résultat est borné entre 0 et 100.

Un quiz inférieur à 60 % recommande du renforcement débutant. Un résultat d’au
moins 80 % augmente le niveau cible. Chaque recommandation enregistre son score
et une justification lisible par l’utilisateur.

## Limites et évolution

Le système n’est pas un réseau neuronal et ne prétend pas l’être. Une évolution
collaborative pourra exploiter les inscriptions, notes et taux de complétion
lorsqu’un volume suffisant d’utilisateurs sera disponible. Les métriques à
suivre sont le taux de clic, l’inscription après recommandation, la complétion
et la note donnée dans `recommendation_feedback`.
