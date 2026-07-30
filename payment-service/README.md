# payment-service EduSmart

Port: `4009`.

## Routes

- `POST /api/payments`
- `GET /api/payments/me`
- `GET /api/payments/:id`
- `POST /api/payments/:id/cancel`
- `POST /api/payments/internal/:id/test-success`
- `POST /api/payments/internal/:id/test-failure`
- `GET /api/payments/admin`
- `GET /api/payments/admin/:id`
- `POST /api/payments/admin/:id/refund`

Les routes internes utilisent le header `x-internal-secret`.

## Création d'un paiement d'adhésion

```json
{
  "paymentType": "INSTRUCTOR_MEMBERSHIP",
  "referenceId": "UUID_ADHESION_PENDING",
  "provider": "TEST",
  "idempotencyKey": "membership-2026-utilisateur"
}
```

Le montant, la devise et le pays sont récupérés depuis `subscription-service`.

## Dépendance course-service

Pour les achats de cours, ajouter ultérieurement :

- `GET /api/courses/internal/:id/payment-details`
- `POST /api/courses/internal/:id/grant-access`
