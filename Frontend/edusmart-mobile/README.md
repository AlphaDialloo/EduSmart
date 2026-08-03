# EduSmart Mobile V1

Application Expo Router pour deux rôles :

- STUDENT
- INSTRUCTOR

## Installation

```bash
npm install
```

Copie `.env.example` vers `.env` puis remplace l’adresse IP :

```env
EXPO_PUBLIC_API_URL=http://TON_IP_LOCALE:3000/api
```

Sur un téléphone physique, n’utilise pas `localhost`.

## Lancement

```bash
npx expo start
```

## Comptes pris en charge

- `STUDENT` est redirigé vers `/(student)/home`
- `INSTRUCTOR` est redirigé vers `/(instructor)/dashboard`

## Endpoints déjà branchés

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/courses`
- `GET /api/courses/:id`
- `GET /api/courses/student/enrollments`
- `GET /api/courses/student/enrollments/:courseId`
- `GET /api/courses/management/instructor-dashboard`
- `GET /api/courses/management/my-courses`
- `GET /api/payments/instructor/analytics`
- endpoints de progression

## Prochaine étape

Brancher :

- lecture vidéo native ;
- aperçu PDF ;
- panier et paiement ;
- création/modification de cours sur mobile ;
- quiz mobile.
