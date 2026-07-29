# settings-service

Microservice de configuration globale pour EduSmart.

## Port

`4007`

## Routes principales

### Publiques

- `GET /health`
- `GET /api/settings/public`
- `GET /api/settings/features`
- `GET /api/settings/features/:key`

### Administration

- `GET /api/settings/admin`
- `PUT /api/settings/admin`
- `POST /api/settings/features`
- `PATCH /api/settings/features/:key`
- `DELETE /api/settings/features/:key`

Les routes d'administration exigent un JWT avec le rôle `ADMIN` ou `SUPER_ADMIN`.

## Installation locale

```bash
npm install
cp .env.example .env
npm run dev
```

## SQL

Exécuter le fichier :

```bash
psql -U edusmart -d edusmart_db -f database/settings_service.sql
```


## Tarification annuelle des formateurs par pays

- `GET /api/settings/countries/memberships`
- `GET /api/settings/countries/:countryCode/membership`
- `POST /api/settings/countries/memberships`
- `PATCH /api/settings/countries/:countryCode/membership`
- `DELETE /api/settings/countries/:countryCode/membership`

Les routes d’écriture exigent un administrateur. La suppression exige `SUPER_ADMIN`.
