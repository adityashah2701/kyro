# UX Refactor — Project Creation & Deployment Configuration

You are continuing the existing project.

Do NOT regenerate previous features.

Preserve all backend logic and existing APIs.

This task is purely a UX, product flow, and frontend architecture refactor.

---

# Goal

Completely redesign the Project Creation experience.

The current implementation asks only for basic project information and forces users to configure deployment settings later.

This creates unnecessary friction.

Instead, redesign the onboarding flow so users can configure everything required for deployment during project creation.

The experience should feel like a modern deployment platform.

Take inspiration from:

- Vercel
- Railway
- Netlify
- Coolify
- Render

Do NOT copy their UI.

Create an original experience.

---

# Product Philosophy

A Project is not just metadata.

A Project represents a deployable application.

Therefore deployment configuration belongs inside project creation.

Users should leave the wizard ready to deploy.

---

# Replace Current Modal

Replace the existing modal with a modern multi-step wizard.

The wizard should support keyboard navigation and mobile responsiveness.

Show progress.

Example:

Project Information

↓

Repository

↓

Framework & Build

↓

Environment Variables

↓

Review & Create

---

# Step 1 — Project Information

Collect:

Project Name

Slug (Auto Generated)

Description

Visibility

Region (Future Ready)

The slug should update automatically.

---

# Step 2 — Repository

Support:

Connect GitHub Repository

Repository Picker

Branch Selection

Repository Search

Manual Repository (Future Placeholder)

If no repository is connected yet, allow skipping.

The project should still be created.

---

# Step 3 — Framework & Build

This is the most important step.

Support automatic framework detection.

Supported frameworks:

Next.js

React (Vite)

React (CRA)

Vue

Nuxt

Astro

SvelteKit

Angular

Remix

SolidStart

Express

Fastify

NestJS

Hono

Node.js

Static HTML

Static Site

Python (Future)

Go (Future)

Rust (Future)

PHP (Future)

Dockerfile

Other

---

# Build Configuration

Users should be able to configure:

Framework

Root Directory

Install Command

Build Command

Start Command

Output Directory

Node Version

Package Manager

These fields should be automatically populated whenever possible.

Allow editing.

Example:

Next.js

Install:
npm install

Build:
next build

Start:
next start

Output:
.next

Root:
/

---

React Vite

Install:
npm install

Build:
vite build

Start:
npm run preview

Output:
dist

---

Static HTML

Install:
None

Build:
None

Start:
None

Output:
/

---

Express

Install:
npm install

Build:
npm run build (optional)

Start:
node server.js

---

NestJS

Install:
npm install

Build:
nest build

Start:
node dist/main.js

---

If a Dockerfile exists, allow:

Use Dockerfile

instead of framework detection.

---

# Root Directory

Allow users to deploy monorepos.

Examples:

/

apps/web

frontend

client

packages/docs

The deployment worker should build only the selected directory.

---

# Environment Variables

Move Environment Variables into the creation wizard.

Users should be able to:

Add Variables

Paste .env

Upload .env

Import Variables

Bulk Edit

Search

Validation

Secrets should remain masked.

---

# Review Screen

Show a deployment summary.

Project

Repository

Branch

Framework

Root Directory

Build Command

Output Directory

Environment Variables Count

Estimated Build Strategy

Users should be able to edit any section before creation.

---

# Create Project

After clicking Create:

Create Project

↓

Store Deployment Configuration

↓

Store Environment Variables

↓

Link Repository

↓

Ready To Deploy

No additional setup should be required before the first deployment.

---

# Future Extensibility

Design the schema so future runtimes can be added without changing UI architecture.

Adding a new framework should only require a configuration object.

Avoid hardcoded conditionals.

Create a framework registry.

Example:

frameworks/

next.ts

vite.ts

astro.ts

node.ts

express.ts

nestjs.ts

docker.ts

static.ts

Each framework definition should include:

name

icon

detectFiles

installCommand

buildCommand

startCommand

outputDirectory

packageManager

runtime

---

# UI Improvements

Use a full-screen dialog instead of a small modal.

Provide:

Progress Sidebar

Keyboard Navigation

Previous / Next Buttons

Autosave Draft

Beautiful Step Indicators

Code Editors for Commands

Framework Icons

Helpful Tooltips

Inline Validation

Command Preview

Estimated Build Pipeline Preview

Modern Empty States

Smooth Framer Motion animations

Loading Skeletons

---

# User Experience

Reduce the number of clicks required to deploy.

The user should finish onboarding feeling that the project is already deployment-ready.

Avoid making users hunt through settings after project creation.

---

# Accessibility

Support:

Keyboard Navigation

Focus Management

ARIA Labels

Screen Readers

Responsive Layout

---

# Code Quality

Follow:

Strict TypeScript

No any

Reusable Components

Feature-Based Architecture

SOLID Principles

Clean Architecture

Configuration-driven framework registry

No duplicated logic

---

# Deliverables

Before writing code:

1. Critique the current project creation UX.
2. Explain why it creates unnecessary friction.
3. Design the new onboarding flow.
4. Explain the framework registry architecture.
5. Explain how future runtimes will plug into the system.

Then implement the complete refactor.

Do not break existing backend functionality.

Adapt the frontend to the improved product flow.

After implementation:

- Explain every changed component.
- Explain how the new UX reduces deployment friction.
- Explain how adding future frameworks requires minimal code changes.
