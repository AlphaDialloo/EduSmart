# EduSmart

Plateforme éducative Web et mobile proposant des parcours, une progression et
des recommandations personnalisées explicables.

## Fonctionnalités

- authentification JWT et rôles étudiant, formateur et administrateur ;
- catalogue, création et publication de cours, modules, ressources et quiz ;
- inscriptions gratuites/payantes, abonnements et paiements ;
- progression par ressource, résultats de quiz et temps d’apprentissage ;
- recommandations hybrides fondées sur profil, objectifs et performances ;
- forums, commentaires et réactions ;
- interfaces React Web et React Native/Expo.

## Architecture

| Service | Port | Responsabilité |
|---|---:|---|
| API Gateway | 3000 | point d’entrée public |
| Auth | 4001 | comptes, JWT et rôles |
| User | 4002 | profils, préférences et objectifs |
| Course | 4003 | cours, ressources et quiz |
| Progress | 4004 | inscriptions et progression |
| Recommendation | 4005 | classement personnalisé explicable |
| Interaction | 4006 | forums et commentaires |
| Settings | 4007 | configuration de plateforme |
| Subscription | 4008 | adhésions formateurs |
| Payment | 4009 | paiements et achats |

PostgreSQL stocke les données transactionnelles; MongoDB stocke les cours et
interactions. Consultez [l’architecture](docs/ARCHITECTURE.md) et la
[documentation du moteur](docs/RECOMMENDATION_MODEL.md).

## Démarrage local

Prérequis : Docker Desktop, Node.js 20 et npm.

```bash
docker compose up --build -d
node scripts/smoke-test.mjs
```

API : `http://localhost:3000`

Santé : `http://localhost:3000/health`

### Web

```bash
cd Frontend/student-web
npm install
npm run dev
```

### Mobile

Copier `.env.example` vers `.env` et utiliser l’adresse LAN de l’ordinateur :

```env
EXPO_PUBLIC_API_URL=http://ADRESSE_IP:3000/api
```

Puis :

```bash
cd Frontend/edusmart-mobile
npm install
npx expo start --lan
```

## Tests

```bash
cd recommendation-service
npm test
npm run check
```

Les builds Web/mobile, les contrôles de syntaxe, Docker, les tests de santé et
la génération Kubernetes sont exécutés par GitHub Actions. Voir le
[rapport de tests](docs/TEST_REPORT.md).

## Kubernetes et déploiement

Les manifestes Kustomize se trouvent dans `k8s/base`. Ils sont validés par la
CI mais jamais appliqués automatiquement :

```bash
kubectl kustomize k8s/base --load-restrictor LoadRestrictionsNone > edusmart.yaml
```

Avant toute publication, remplacez le registre `your-org`, les secrets de
démonstration et les adresses locales. Consultez le [guide de déploiement](docs/DEPLOYMENT.md).

## Documentation du projet

- [Architecture et diagrammes UML](docs/ARCHITECTURE.md)
- [Moteur de recommandation](docs/RECOMMENDATION_MODEL.md)
- [Tests et recette](docs/TEST_REPORT.md)
- [Préparation du déploiement](docs/DEPLOYMENT.md)
- [Scénarios API](docs/TESTS_API.md)
