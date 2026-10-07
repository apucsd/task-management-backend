# Project & Task Management API

A scalable, production-ready RESTful API backend built with **NestJS**, **PostgreSQL**, and **Prisma ORM**.

---

## ⚡ Features & Architecture

- **🔐 Authentication & Security**
  - JWT Authentication (Access & Refresh tokens with HTTP-only cookies)
  - Email OTP Verification for registration & password reset
  - Rate limiting & brute-force protection (`@nestjs/throttler`)
  - Password hashing with Bcrypt

- **🗄️ Database & ORM**
  - PostgreSQL database with Prisma ORM
  - Modular schema organization (`prisma/models/`)
  - Database seeding for initial setup

- **📧 Email Services**
  - Transactional email service using Nodemailer & Handlebars
  - Email OTP delivery for verification and password reset

- **🌐 API Standards & Quality**
  - Global response transformation envelope (`{ success, message, data, meta, timestamp }`)
  - Global exception filter with structured error logging
  - Generic QueryBuilder for flexible search, filtering, sorting, and pagination
  - Interactive Swagger / OpenAPI documentation (`/api/docs`)

---

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT, Passport
- **Rate Limiting:** `@nestjs/throttler` (In-Memory)
- **Email:** `@nestjs-modules/mailer`, Nodemailer, Handlebars
- **Validation:** `class-validator`, `class-transformer`
- **Documentation:** Swagger UI

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: `v18.x` or higher
- **Package Manager**: `yarn` or `npm`
- **PostgreSQL**: Running instance (Local or Cloud like Supabase / Neon)


---

### 2. Installation & Environment

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env
```

Ensure your `.env` contains valid database and credentials.

---

### 3. Database Migration & Seeding

```bash
# Generate Prisma Client
yarn generate

# Run database migrations
yarn migrate

# Seed database with initial Admin user
yarn db:seed
```

---

### 4. Running the Application

```bash
# Development mode
yarn dev

# Production build
yarn build

# Run production
yarn start:prod
```

---

## 📖 API Documentation

Once the server is running:
- **Swagger Documentation:** `http://localhost:4000/api/docs`
- **Base API Path:** `http://localhost:4000/api/v1`

---

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Linting
yarn lint
```
