# MedlyGo

**Hospital Appointment Booking Platform for Ghana**

MedlyGo is a web-based platform that allows patients to book non-emergency appointments at public and private hospitals across Ghana, eliminating the need to queue at hospitals for basic consultations. Hospitals manage their schedules, departments, and providers through dedicated dashboards, while a super admin oversees hospital onboarding and system-wide operations.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Docker Setup](#alternative-full-docker-setup)
- [GitHub Codespaces](#github-codespaces)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Accessing the Database](#accessing-the-database)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Appointment Lifecycle](#appointment-lifecycle)
- [Internationalization](#internationalization)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Features

### Patient

- **Appointment Booking**: Step-by-step wizard: select hospital, choose department, pick date/time, confirm
- **AI Assistant**: Claude-powered chatbot that recommends the right department based on symptom descriptions
- **Appointment Management**: View upcoming and past appointments, cancel or reschedule with a reason
- **Notifications**: Receive email and SMS reminders 24 hours before appointments
- **Feedback**: Rate and review providers after completed visits
- **Patient Profile**: Manage personal info, Ghana Card ID, NHIS number, emergency contacts, and medical history references
- **Onboarding Wizard**: Guided first-time profile setup after registration
- **Multi-language**: Switch between English and Twi (Akan) in the UI

### Hospital / Provider

- **Appointment Dashboard**: View and manage incoming appointment requests
- **Approve / Reject / Suggest**: Approve appointments, reject with a reason, or suggest an alternative date/time
- **Schedule Management**: Set weekly availability (day of week, start/end time, slot duration, max patients per slot)
- **Patient Records**: View patient information for scheduled appointments
- **Feedback & Ratings**: See patient reviews and ratings
- **Department Management**: Organize services by department

### Admin

- **Hospital Onboarding**: Register new hospitals with full details (name, address, location, type, hours, departments)
- **Provider Onboarding**: Create provider accounts linked to hospitals and departments
- **System Dashboard**: Monitor all appointments, patients, and hospitals across the platform
- **Settings**: Configure system-wide settings

### Technical

- **Role-based Access Control**: Three roles (Patient, Provider, Admin) with middleware-enforced route protection
- **JWT Authentication**: NextAuth.js v5 with credentials and Google OAuth providers
- **Appointment Reference Numbers**: Unique reference codes for each booking
- **Real-time Status Tracking**: 10-stage appointment lifecycle from booking to completion
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **NHIS Integration**: Patient records support National Health Insurance Scheme numbers
- **Ghana Card Support**: Store and reference Ghana Card IDs for patient identification
- **Automated Reminders**: Cron-triggered email and SMS notifications

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| Database | MySQL 8.0 |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Auth.js) |
| AI | Claude 3.5 Sonnet (Vercel AI SDK) |
| Email | Resend + React Email |
| SMS | Hubtel |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Icons | Lucide React |
| i18n | next-intl |
| DevOps | Docker, Docker Compose, GitHub Codespaces |

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone and Install

```bash
git clone https://github.com/mdzidulla/MedlyGo.git
cd MedlyGo
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env
```

Edit `.env` and set your values. At minimum, generate a proper `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Start the Database

```bash
docker compose up db -d
```

Wait about 30 seconds for MySQL to fully initialize.

### 4. Run Migrations

```bash
# Use root user for migrations (has permission to create shadow database)
DATABASE_URL="mysql://root:medlygo_root@localhost:3306/medlygo" npx prisma migrate dev --name init
```

> **Windows PowerShell:** Use `$env:DATABASE_URL="mysql://root:medlygo_root@localhost:3306/medlygo"; npx prisma migrate dev --name init`

### 5. Create Super Admin

```bash
npm run db:create-admin
```

This will interactively prompt you for email, name, and password. Only admins can onboard hospitals and providers. Patients sign up themselves through the website.

### 6. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Alternative: Full Docker Setup

Run both the database and app in containers:

```bash
docker compose up -d
```

The app will auto-run migrations and start at [http://localhost:3000](http://localhost:3000).

To create an admin user inside the container:

```bash
docker exec -it medlygo-app-1 npx tsx scripts/create-admin.ts
```

## GitHub Codespaces

Click **"Code" > "Codespaces" > "Create codespace on main"** in the GitHub repo. The devcontainer will automatically:

1. Start MySQL and the app via Docker Compose
2. Install dependencies
3. Generate Prisma client
4. Run database migrations
5. Start the dev server on port 3000

You'll still need to create an admin user via the terminal: `npm run db:create-admin`

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | Yes |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000`) | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT signing (`openssl rand -base64 32`) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI chat assistant | No |
| `RESEND_API_KEY` | Resend API key for email notifications | No |
| `HUBTEL_CLIENT_ID` | Hubtel client ID for SMS notifications | No |
| `HUBTEL_CLIENT_SECRET` | Hubtel client secret for SMS | No |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | No |
| `CRON_SECRET` | Secret for cron job authorization | No |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (Docker) | Docker only |
| `MYSQL_DATABASE` | MySQL database name (Docker) | Docker only |
| `MYSQL_USER` | MySQL user (Docker) | Docker only |
| `MYSQL_PASSWORD` | MySQL user password (Docker) | Docker only |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI at localhost:5555) |
| `npm run db:create-admin` | Create a super admin user |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:reset` | Reset Docker (wipes database) |

## Accessing the Database

**Prisma Studio** (recommended):

```bash
npm run db:studio
```

Opens a web GUI at [http://localhost:5555](http://localhost:5555) where you can browse and edit all tables.

**MySQL CLI** (via Docker):

```bash
docker exec -it medlygo-db-1 mysql -u medlygo -pmedlygo_pass medlygo
```

**Any MySQL GUI** (MySQL Workbench, DBeaver, TablePlus):

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| User | `medlygo` |
| Password | `medlygo_pass` |
| Database | `medlygo` |

## Project Structure

```
MedlyGo/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (admin)/                # Admin dashboard, hospitals, patients, settings
│   │   ├── (auth)/                 # Login, signup, forgot/reset password, verify
│   │   ├── (patient)/              # Patient dashboard, booking, appointments, profile
│   │   ├── (provider)/             # Provider dashboard, appointments, schedule, patients
│   │   ├── (public)/               # Public pages (about, FAQ, contact, privacy, terms)
│   │   ├── api/                    # API routes (auth, admin, chat, cron, user)
│   │   ├── layout.tsx              # Root layout with SessionProvider
│   │   └── page.tsx                # Landing page
│   ├── components/                 # Shared UI components
│   │   ├── chat/                   # AI chat widget
│   │   ├── layout/                 # Headers, footers, navigation
│   │   └── ui/                     # Base components (button, card, input, badge)
│   ├── i18n/                       # Internationalization configuration
│   ├── lib/                        # Utilities & server actions
│   │   ├── admin/                  # Admin CRUD operations
│   │   ├── appointments/           # Patient & provider appointment actions
│   │   ├── dashboard/              # Dashboard data fetching
│   │   ├── provider/               # Provider schedule & data actions
│   │   ├── auth.ts                 # NextAuth configuration (providers, callbacks)
│   │   ├── auth-client.ts          # Client-side auth (signIn, signUp, signOut)
│   │   ├── auth-helpers.ts         # Server-side auth (requireAuth, requireRole)
│   │   ├── prisma.ts               # Prisma client singleton
│   │   └── utils.ts                # General utilities (cn, formatDate, etc.)
│   ├── locales/                    # Translation JSON files (en.json, tw.json)
│   ├── services/                   # Business logic services
│   │   ├── ai/                     # Claude AI chat agent
│   │   └── notifications/          # Email (Resend) & SMS (Hubtel) services
│   ├── types/                      # TypeScript type definitions
│   └── middleware.ts               # Route protection & role-based redirects
├── prisma/
│   ├── schema.prisma               # Database schema (12 models, 5 enums)
│   └── migrations/                 # Database migration files
├── scripts/
│   └── create-admin.ts             # Interactive super admin creation script
├── emails/                         # React Email templates
├── .devcontainer/                  # GitHub Codespaces configuration
│   └── devcontainer.json
├── docker-compose.yml              # MySQL + App services
├── Dockerfile                      # Node 20 Alpine container
├── .env.local.example              # Environment variable template
├── tailwind.config.ts              # Tailwind CSS configuration
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

## Database Schema

```
User ──────── Patient ───── Appointment ───── Notification
  │               │               │
  │               └── Feedback ───┘
  │
  ├── Provider ─── Schedule
  │      │
  │      └── Hospital ─── Department
  │
  ├── Account (OAuth)
  └── Session
```

### Models

| Model | Description |
|---|---|
| **User** | All system users (patient, provider, admin) with auth credentials |
| **Patient** | Patient profiles: date of birth, gender, Ghana Card, NHIS number, emergency contacts |
| **Hospital** | Partner hospitals: name, address, GPS coordinates, type (public/private), hours, ratings |
| **Department** | Hospital departments (e.g., General Medicine, Pediatrics, Dental) |
| **Provider** | Doctors and healthcare providers linked to a hospital and department |
| **Schedule** | Provider weekly availability: day of week, time slots, max patients per slot |
| **Appointment** | Booking records with full lifecycle tracking, reference numbers, and review history |
| **Notification** | Email and SMS notification records with delivery status |
| **Feedback** | Patient ratings (1-5) and written reviews for providers |
| **Account** | OAuth provider accounts (NextAuth) |
| **Session** | User sessions (NextAuth) |
| **VerificationToken** | Email verification and password reset tokens |

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `patient`, `provider`, `admin` |
| `AppointmentStatus` | `pending`, `confirmed`, `rejected`, `suggested`, `scheduled`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show` |
| `HospitalType` | `public`, `private` |
| `NotificationType` | `sms`, `email` |
| `NotificationStatus` | `pending`, `sent`, `failed` |

## Authentication

MedlyGo uses **NextAuth.js v5** with a JWT session strategy.

### Providers

- **Credentials**: Email and password authentication (passwords hashed with bcrypt)
- **Google OAuth**: External authentication via Google (optional, requires client ID/secret)

### Roles

| Role | Route Access | How They're Created |
|---|---|---|
| `patient` | `/dashboard/*` | Self-signup via the website |
| `provider` | `/provider/*` | Onboarded by admin through the admin dashboard |
| `admin` | `/admin/*` | Created via `npm run db:create-admin` script |

### Session

The JWT token contains `id`, `email`, `name`, `image`, and `role`. The middleware at `src/middleware.ts` reads the session on every request and:

- Redirects unauthenticated users to `/login` for protected routes
- Redirects users to their role-appropriate dashboard if they try to access unauthorized areas
- Redirects authenticated users away from auth pages (login, signup) to their dashboard

## API Routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js handler (login, logout, session, OAuth callbacks) | Public |
| `POST` | `/api/auth/register` | Register a new patient account | Public |
| `POST` | `/api/auth/forgot-password` | Request a password reset email | Public |
| `POST` | `/api/auth/reset-password` | Reset password with a valid token | Public |
| `POST` | `/api/chat` | AI chat assistant (Claude) for symptom-based department recommendations | Authenticated |
| `POST` | `/api/admin/hospitals` | Create a new hospital with departments and provider account | Admin |
| `DELETE` | `/api/user/delete` | Delete the currently authenticated user's account | Authenticated |
| `GET` | `/api/cron/reminders` | Send appointment reminder notifications (24-hour window) | Cron secret |

## Appointment Lifecycle

```
Patient books    Provider reviews    Day of visit     After visit
───────────── → ──────────────── → ─────────────── → ───────────

  pending ──→ confirmed ──→ scheduled ──→ checked_in ──→ in_progress ──→ completed
    │              │
    │              ├──→ rejected (provider declines)
    │              │
    │              └──→ suggested (provider proposes alternative)
    │                       │
    │                       └──→ pending (patient accepts suggestion)
    │
    └──→ cancelled (patient or provider cancels at any time)

  * no_show — marked when patient doesn't arrive for a confirmed appointment
```

### Status Descriptions

| Status | Description |
|---|---|
| `pending` | Appointment booked, waiting for provider review |
| `confirmed` | Provider has approved the appointment |
| `rejected` | Provider declined the appointment (with reason) |
| `suggested` | Provider proposed an alternative date/time |
| `scheduled` | Confirmed and approaching appointment date |
| `checked_in` | Patient has arrived at the hospital |
| `in_progress` | Consultation is currently happening |
| `completed` | Appointment finished successfully |
| `cancelled` | Cancelled by patient or provider (with reason) |
| `no_show` | Patient did not attend the appointment |

## Internationalization

MedlyGo supports two languages:

- **English** (default)
- **Twi** (Akan)

Translation files are stored in `src/locales/` as JSON. The language can be switched via the UI language toggle in the header. The i18n system uses `next-intl` for server and client-side translations.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run the build to verify (`npm run build`)
5. Commit your changes (`git commit -m "Add your feature"`)
6. Push to your branch (`git push origin feature/your-feature`)
7. Open a Pull Request

## Authors

- **mdzidulla**: [GitHub](https://github.com/mdzidulla)

