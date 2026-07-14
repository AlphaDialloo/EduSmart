# EduSmart — Semaine 2 : Prototype Backend Microservices

Ce livrable contient le prototype backend de la plateforme éducative intelligente avec recommandations personnalisées.

## Services

| Service | Port | Rôle |
|---|---:|---|
| api-gateway | 3000 | Point d’entrée unique |
| auth-service | 4001 | Inscription, connexion, JWT |
| user-service | 4002 | Profils et préférences |
| course-service | 4003 | Cours, modules, ressources, quiz |
| progress-service | 4004 | Progression et scores |
| recommendation-service | 4005 | Recommandations personnalisées |
| interaction-service | 4006 | Forums et commentaires |

## Lancement

```bash
docker compose up --build
```

Tester ensuite :

```bash
http://localhost:3000/health
```

## Ordre de test conseillé

1. Créer un étudiant avec `/api/auth/register`
2. Se connecter avec `/api/auth/login`
3. Copier le token JWT
4. Modifier le profil étudiant
5. Créer un formateur
6. Créer un cours avec le token formateur
7. Publier le cours
8. Inscrire l’étudiant au cours
9. Ajouter un résultat de quiz
10. Générer les recommandations
