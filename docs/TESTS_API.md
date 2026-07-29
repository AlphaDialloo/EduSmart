# Tests API

## Inscription étudiant

POST http://localhost:3000/api/auth/register

```json
{
  "firstName": "Jordan",
  "lastName": "Dongmeza",
  "email": "jordan@test.com",
  "password": "123456",
  "role": "STUDENT"
}
```

## Connexion

POST http://localhost:3000/api/auth/login

```json
{
  "email": "jordan@test.com",
  "password": "123456"
}
```

## Modifier profil

PUT http://localhost:3000/api/users/profile/student
Header: Authorization: Bearer TOKEN

```json
{
  "currentLevel": "BEGINNER",
  "learningStyle": "VIDEO",
  "bio": "Étudiant intéressé par le développement web."
}
```

## Créer formateur

POST http://localhost:3000/api/auth/register

```json
{
  "firstName": "Steve",
  "lastName": "Ataky",
  "email": "formateur@test.com",
  "password": "123456",
  "role": "INSTRUCTOR"
}
```

## Créer un cours avec token formateur

POST http://localhost:3000/api/courses

```json
{
  "title": "Introduction à JavaScript",
  "description": "Bases de JavaScript",
  "category": "Programmation Web",
  "level": "BEGINNER",
  "tags": ["javascript", "web"]
}
```
