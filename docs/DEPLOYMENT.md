# Préparation du déploiement

Le dépôt ne déploie rien automatiquement. La personne responsable du compte
cloud choisit le registre, le cluster et les services de données.

## Images

Construire les images avec `docker compose build`, les étiqueter, puis les
publier dans GHCR, Docker Hub, ACR ou ECR. Remplacer ensuite `your-org` dans
`k8s/base/services.yaml`.

## Secrets obligatoires

- `DB_PASSWORD` ;
- `JWT_SECRET` ;
- `INTERNAL_SERVICE_SECRET` ;
- identifiants Cloudinary et Stripe si ces fonctions sont activées.

Ne jamais conserver les secrets réels dans Git. Utiliser les secrets du
fournisseur cloud ou un gestionnaire tel que Vault.

## Données

Pour une démonstration, les manifestes incluent PostgreSQL et MongoDB avec PVC.
En production, utiliser des bases gérées, sauvegardées et accessibles seulement
depuis le réseau privé du cluster.

## Frontends

Le Web peut être publié séparément sur Vercel/Netlify avec l’URL publique de
l’API. L’application mobile doit recevoir `EXPO_PUBLIC_API_URL` au moment de la
construction EAS; une adresse IP locale ne doit jamais être utilisée en production.
