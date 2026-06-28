# Feature 01 — Authentication System

You are continuing the existing project.

**DO NOT regenerate anything from the initialization phase.**

Use the existing architecture, folder structure, coding standards, and dependencies that are already configured.

---

# Goal

Build a production-ready authentication system for our deployment platform.

This is **NOT** a demo application.

The authentication system should be scalable, secure, and suitable for a SaaS platform.

---

# Tech Stack

- Next.js 15
- App Router
- TypeScript
- Better Auth
- PostgreSQL
- Drizzle ORM
- Tailwind CSS
- shadcn/ui
- Zod

---

# Requirements

Implement the complete authentication system.

## Authentication

- GitHub OAuth Login
- Session Management
- Secure Cookies
- Persistent Sessions
- Sign In
- Sign Out
- User Session Retrieval
- Authentication Provider

---

## Database

Integrate authentication with PostgreSQL using Drizzle ORM.

Create the user schema.

Fields:

- id (UUID)
- name
- email
- image
- githubId
- createdAt
- updatedAt

Use UUIDs for every primary key.

---

## Authorization

Protect authenticated routes.

### Public Routes

- /
- /login
- /privacy
- /docs

### Protected Routes

- /dashboard
- /projects
- /settings

If an unauthenticated user visits a protected route, redirect them to `/login`.

If an authenticated user visits `/login`, redirect them to `/dashboard`.

---

## Middleware

Implement authentication middleware using Next.js App Router.

The middleware should:

- Verify session
- Protect private routes
- Redirect users appropriately
- Avoid unnecessary database queries where possible

---

## UI

Create:

- Login Page
- Dashboard Placeholder
- Loading State
- Error State
- Authentication Button

Use shadcn/ui components.

Keep the design minimal and modern.

---

## Folder Structure

Follow the existing feature-based architecture.

Authentication feature should contain:

- components/
- hooks/
- actions/
- server/
- services/
- schemas/
- types/

Do not place business logic inside UI components.

---

## Code Quality

Follow these rules strictly:

- Strict TypeScript
- No `any`
- SOLID Principles
- Clean Architecture
- Reusable Components
- Reusable Hooks
- Proper Error Handling
- Environment Validation
- Modular Code
- Consistent Naming

---

## Error Handling

Handle:

- Invalid OAuth callback
- Expired sessions
- Missing session
- Missing environment variables
- Database errors
- Authentication failures

Display user-friendly error messages.

---

## Security

Use secure authentication practices.

Implement:

- Secure Cookies
- HTTP Only Cookies
- CSRF Protection (if required)
- Proper Session Validation
- Server-side Authentication
- Never expose secrets to the client

---

## Deliverables

Before writing code:

1. Explain the authentication architecture.
2. Explain why Better Auth is being used.
3. Explain how sessions are stored.
4. Explain how middleware works.
5. Explain the database changes.

Then:

- Generate the complete implementation.
- Keep everything modular.
- Follow the existing project architecture.

---

## Do NOT Implement

Do **NOT** implement:

- Projects
- Deployments
- GitHub Repository Import
- Docker Workers
- Build Queue
- Domains
- Environment Variables
- Dashboard Features
- Deployment Engine

Only implement the authentication system.

---

## Completion

After completing this feature:

- Explain every generated file.
- Explain why each file exists.
- Suggest the next feature.
- Wait for further instructions before implementing anything else.
