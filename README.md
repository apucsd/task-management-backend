# Project & Task Management System — Backend API

A production-grade, scalable RESTful API built with **NestJS**, **PostgreSQL**, and **Prisma ORM** for the Mid-Level Assessment.

---

## 🌐 Live Deployments

| Component | Platform / Host | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://todo-task-frontend-three.vercel.app](https://todo-task-frontend-three.vercel.app/) |
| **Backend REST API** | Azure VM (Ubuntu 22.04 LTS) | [https://zmc-taskflow.centralindia.cloudapp.azure.com](https://zmc-taskflow.centralindia.cloudapp.azure.com) |
| **Interactive Swagger Docs** | Azure VM | [https://zmc-taskflow.centralindia.cloudapp.azure.com/api/docs](https://zmc-taskflow.centralindia.cloudapp.azure.com/api/docs) |
| **Base API Endpoint** | Azure VM | `https://zmc-taskflow.centralindia.cloudapp.azure.com/api/v1` |

> [!NOTE]
> **Cloud Infrastructure Note**: The backend is hosted on a self-managed **Azure Linux Virtual Machine (Student Plan)** running Ubuntu 22.04 LTS, configured with an **Nginx** reverse proxy, SSL termination, and **PM2** process management for 24/7 high availability with zero serverless cold starts.

---

## 🔑 Evaluation & Test Accounts

You can log in directly with the primary demo account to immediately explore active projects, tasks, and metrics:

### 🌟 Primary Account (Recommended — Rich Data)
- **Email:** `apusutradhar77@gmail.com`
- **Password:** `12345678`
- **Context:** Primary test account populated with multiple live projects, workspaces, members, and tasks.

---

### 👥 Additional Pre-Seeded Collaboration Accounts
Use these accounts to test cross-user collaboration, permissions, and IDOR prevention:

**Default Password for below accounts:** `Password123!`

| Email | User Name | Role & Evaluation Context |
| :--- | :--- | :--- |
| `john@example.com` | John Doe | **Owner** of *Website Redesign*, Member of *Mobile App* |
| `jane@example.com` | Jane Smith | **Owner** of *Mobile App*, Member of *Website Redesign* |
| `bob@example.com` | Bob Johnson | **Owner** of *Internal Analytics*, Member of *Website Redesign* |

---

## ⚡ Architecture & Business Highlights

### 1. 🛡️ Strict Authorization & IDOR Prevention
- **URL Tampering Protection**: Access to projects and tasks is strictly scoped to verified memberships. Non-members attempting to view, edit, or delete entities by guessing or changing UUIDs in the URL are immediately rejected with **`403 Forbidden`**.
- **Owner vs. Member Permissions**: Only project owners can edit project details, delete projects, or remove members. Regular members are restricted to task collaboration.
- **Assignment Validation**: Tasks can only be assigned to registered users who are confirmed members of that specific project.

### 2. 🔍 Advanced QueryBuilder
- Full support for search, filtering, sorting, and pagination across tasks and projects:
  - **Search**: Case-insensitive text search across `title` and `description`.
  - **Filtering**: Multi-parameter filters for `status`, `priority`, `assigneeId`, and `projectId`.
  - **Sorting**: Flexible sorting parameters (e.g., `-createdAt`, `dueDate`, `priority`).
  - **Pagination**: Structured pagination metadata returning `{ total, page, limit, totalPages }`.

### 3. 📊 Dashboard Overview Metrics
- High-performance overview endpoint (`GET /api/v1/dashboard/overview`) delivering aggregated metrics in a single query:
  - **Projects**: Total accessible projects, active projects (with pending tasks).
  - **Tasks**: Total tasks, completed, in-progress, todo, and high-priority items.

### 4. 🗄️ Relational Database & ORM Design
- PostgreSQL database hosted on Neon connected via Prisma ORM using `@prisma/adapter-pg`.
- Explicit `ProjectMember` junction model with `@@unique([projectId, userId])` and cascade deletion rules to maintain referential integrity.
- Migration history tracked in `prisma/migrations` with 0 drift.

### 5. 🌐 Production-Ready Standards
- **Global Response Envelope**: All API endpoints return a standardized format:
  `{ success: boolean, message: string, data: T, meta?: PaginationMeta, timestamp: string }`
- **Global Exception Filter**: Catches NestJS exceptions and Prisma database errors, providing structured JSON responses and error logging.
- **Resilient Email Delivery**: Fire-and-forget asynchronous OTP email delivery with console fallback to prevent SMTP latency from blocking HTTP requests.
- **Cross-Region Network Optimization**: Enforces IPv4 resolution (`net.setDefaultAutoSelectFamily(false)`) to prevent cross-continental TCP timeouts.

---

## 🛠️ Technology Stack

- **Backend Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma 7 (`@prisma/adapter-pg`)
- **Authentication:** JWT, Passport, Bcrypt password hashing
- **Security & Rate Limiting:** `@nestjs/throttler`, CORS whitelist, HTTP-only cookie support
- **Email Service:** Nodemailer, Handlebars
- **Validation:** `class-validator`, `class-transformer`
- **API Documentation:** Swagger / OpenAPI UI

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `yarn`
- **PostgreSQL**: Local instance or Cloud URI (Neon, Supabase)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/apucsd/task-management-backend.git
cd task-management-backend

# Install dependencies
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000

# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/task_management?schema=public"

# AUTHENTICATION
JWT_SECRET="your-super-secret-jwt-key"
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_TOKEN_EXPIRES_IN="7d"
JWT_REFRESH_TOKEN_EXPIRES_IN="30d"

# SMTP EMAIL (Optional - OTP is also printed in server logs)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. Database Migrations & Seeding
```bash
# Generate Prisma Client
yarn generate

# Run database migrations
yarn migrate

# Seed database with sample test accounts, projects, and tasks
yarn db:seed
```

### 5. Running the Application
```bash
# Start in development mode (with hot-reload)
yarn dev

# Compile production bundle
yarn build

# Start production server
yarn start:prod
```

---

## 🧪 Testing & Code Quality

```bash
# Run ESLint validation
yarn lint

# Run Unit tests
yarn test

# Run E2E tests
yarn test:e2e
```

---

## 📖 API Documentation Endpoints

When running locally:
- **Interactive Swagger UI:** `http://localhost:4000/api/docs`
- **Base API Path:** `http://localhost:4000/api/v1`

When testing the live Azure server:
- **Interactive Swagger UI:** `https://zmc-taskflow.centralindia.cloudapp.azure.com/api/docs`
- **Base API Path:** `https://zmc-taskflow.centralindia.cloudapp.azure.com/api/v1`
