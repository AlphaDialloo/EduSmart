# subscription-service

Microservice EduSmart responsable de l'adhésion annuelle des formateurs.
Le prix n'est jamais fourni par le client : il est récupéré dans le
`settings-service` selon le pays.

## Installation

```bash
cp .env.example .env
npm install
npm run dev
```

## Routes formateur

- `POST /api/subscriptions`
- `POST /api/subscriptions/renew`
- `GET /api/subscriptions/me`
- `GET /api/subscriptions/me/status`
- `POST /api/subscriptions/:id/cancel`

Corps de création ou renouvellement :

```json
{
  "countryCode": "CM",
  "planCode": "INSTRUCTOR_ANNUAL",
  "autoRenew": false
}
```

## Routes internes

Exigent l'en-tête `x-internal-secret`.

- `GET /api/subscriptions/internal/instructors/:instructorId/active`
- `POST /api/subscriptions/internal/:id/activate`
- `POST /api/subscriptions/internal/:id/payment-failed`
- `POST /api/subscriptions/internal/expire-elapsed`

Activation :

```json
{
  "paymentId": "00000000-0000-0000-0000-000000000000"
}
```

## Routes administrateur

- `GET /api/subscriptions/admin`
- `GET /api/subscriptions/admin/:id`
- `PATCH /api/subscriptions/admin/:id/status`

Filtres de liste : `page`, `limit`, `status`, `instructorId`, `countryCode`.

## Règle de renouvellement

Si une adhésion est encore active au moment où un renouvellement est payé,
la nouvelle période commence à l'expiration de la période courante. Les deux
périodes sont conservées pour garantir l'historique financier et contractuel.
