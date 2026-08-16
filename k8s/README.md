# Déploiement Kubernetes EduSmart

Les manifestes déploient PostgreSQL, MongoDB et les dix microservices. Ils ne
publient aucune image automatiquement.

## Préparation

1. Construire et publier les images dans votre registre.
2. Remplacer `ghcr.io/your-org` dans `base/services.yaml`.
3. Remplacer toutes les valeurs `change-me-before-deployment` dans
   `base/config.yaml` ou créer le secret avec votre gestionnaire de secrets.
4. Vérifier la classe de stockage et les tailles des volumes.

## Validation et application

```bash
kubectl kustomize k8s/base --load-restrictor LoadRestrictionsNone > edusmart.yaml
kubectl apply -f edusmart.yaml
kubectl -n edusmart get pods,services
```

Le service `api-gateway` est de type `LoadBalancer`. Dans un cluster local,
utilisez `kubectl port-forward -n edusmart service/api-gateway 3000:80`.

Pour un environnement de production, privilégiez PostgreSQL et MongoDB gérés
et retirez les deux déploiements de bases de données inclus pour la démonstration.
