# Architecture et modélisation EduSmart

## Cas d’utilisation

```mermaid
flowchart LR
  Student((Étudiant)) --> Register[S'inscrire / se connecter]
  Student --> Catalog[Consulter le catalogue]
  Student --> Learn[Suivre un cours]
  Student --> Quiz[Passer un quiz]
  Student --> Progress[Consulter sa progression]
  Student --> Reco[Recevoir des recommandations]
  Student --> Forum[Publier et commenter]
  Instructor((Formateur)) --> Manage[Créer et publier des cours]
  Instructor --> Resources[Gérer modules, ressources et quiz]
  Instructor --> Analytics[Consulter ventes et statistiques]
  Admin((Administrateur)) --> Users[Gérer utilisateurs et rôles]
  Admin --> Moderate[Gérer cours, catégories et paiements]
```

## Architecture des services

```mermaid
flowchart TB
  Web[React Web] --> Gateway[API Gateway]
  Mobile[React Native / Expo] --> Gateway
  Gateway --> Auth[Auth service]
  Gateway --> User[User service]
  Gateway --> Course[Course service]
  Gateway --> Progress[Progress service]
  Gateway --> Recommendation[Recommendation service]
  Gateway --> Interaction[Interaction service]
  Gateway --> Payment[Payment service]
  Gateway --> Subscription[Subscription service]
  Gateway --> Settings[Settings service]
  Auth --> PG[(PostgreSQL)]
  User --> PG
  Progress --> PG
  Recommendation --> PG
  Payment --> PG
  Subscription --> PG
  Settings --> PG
  Course --> Mongo[(MongoDB)]
  Interaction --> Mongo
  Recommendation --> User
  Recommendation --> Progress
  Recommendation --> Course
```

## Modèle de données principal

```mermaid
erDiagram
  USER ||--o| STUDENT_PROFILE : possede
  USER ||--o{ ENROLLMENT : suit
  ENROLLMENT ||--o{ RESOURCE_PROGRESS : contient
  ENROLLMENT ||--o{ QUIZ_ATTEMPT : produit
  USER ||--o{ RECOMMENDATION : recoit
  RECOMMENDATION ||--o{ RECOMMENDATION_FEEDBACK : evalue
  USER ||--o{ PAYMENT : effectue
  COURSE ||--o{ MODULE : contient
  MODULE ||--o{ RESOURCE : contient
  COURSE ||--o{ QUIZ : propose
  COURSE ||--o{ FORUM_POST : concerne
  FORUM_POST ||--o{ COMMENT : contient
```

`USER`, les inscriptions de progression, paiements et recommandations sont
stockés dans PostgreSQL. `COURSE`, ses documents imbriqués et les interactions
sont stockés dans MongoDB. Les identifiants de cours sont conservés sous forme
de chaîne dans PostgreSQL pour relier les deux technologies.

## Séquence : terminer une ressource

```mermaid
sequenceDiagram
  actor E as Étudiant
  participant M as Mobile/Web
  participant G as API Gateway
  participant C as Course service
  participant P as Progress service
  participant DB as PostgreSQL
  E->>M: Ouvre un cours
  M->>G: GET /courses/student/enrollments/:courseId
  G->>C: Vérifier le droit d'accès
  C-->>M: Cours, modules et ressources
  M->>G: POST /progress/resources/progress
  G->>P: Ressource terminée
  P->>DB: Upsert progression et recalcul global
  DB-->>P: Pourcentage mis à jour
  P-->>M: Résumé de progression
```

## Activité : recommandations

```mermaid
flowchart TD
  A[Demande de recommandations] --> B[Charger profil et objectifs]
  B --> C[Charger quiz et inscriptions]
  C --> D[Charger les cours publiés]
  D --> E[Exclure cours inactifs ou déjà suivis]
  E --> F[Score niveau + préférences + objectifs + popularité]
  F --> G[Trier et limiter]
  G --> H[Enregistrer score et justification]
  H --> I[Afficher Web/mobile]
```

## Déploiement

```mermaid
flowchart LR
  Internet --> LB[LoadBalancer / Ingress]
  LB --> Gateway[2+ API Gateway pods]
  Gateway --> Services[Pods microservices]
  Services --> PG[(PostgreSQL géré ou PVC)]
  Services --> Mongo[(MongoDB géré ou PVC)]
  Registry[Registre d'images] --> Gateway
  Registry --> Services
  CI[GitHub Actions] --> Registry
```
