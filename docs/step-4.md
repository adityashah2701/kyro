# Feature 03 — Projects Module

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture, design system, authentication, and coding standards.

---

# Goal

Build a production-ready Projects module.

This is the core entity of the platform.

Every deployment, environment variable, domain, and build will belong to a Project.

---

# Database

Create the Project schema using Drizzle ORM.

Fields:

- id (UUID)
- userId (Foreign Key)
- name
- slug
- description
- framework
- visibility (private/public)
- status (active/archived)
- createdAt
- updatedAt

Requirements:

- UUID primary keys
- Proper indexes
- Foreign key constraints
- Cascade delete where appropriate
- Unique slug per user

---

# CRUD Operations

Implement complete CRUD.

Users should be able to:

- Create Project
- View Project
- Edit Project
- Delete Project
- Archive Project
- Restore Project

Soft delete is preferred.

---

# Validation

Use Zod.

Validate:

- Project name
- Slug
- Description
- Framework
- Visibility

Show proper validation messages.

---

# UI

Create a premium Projects page.

Include:

- Responsive Project Grid
- List View
- Search Projects
- Sort Projects
- Filter Projects
- Empty State
- Loading Skeleton
- Error State

---

# Create Project

Create a modern modal.

Fields:

- Name
- Slug
- Description
- Framework

Framework options:

- React
- Next.js
- Vite
- Vue
- Nuxt
- Angular
- Astro
- Svelte
- Remix
- Other

Generate slug automatically.

Allow editing.

---

# Project Card

Every card should display:

- Project Name
- Framework Badge
- Visibility
- Last Updated
- Status
- Deployment Count (placeholder)
- Quick Actions

Include:

- Open
- Edit
- Delete
- Archive

---

# Project Details Page

Create:

/projects/[projectId]

Include placeholders for:

- Deployments
- Domains
- Environment Variables
- Analytics
- Activity

Do NOT implement those features.

---

# Server Actions

Use Server Actions where appropriate.

Keep database logic outside UI components.

---

# Authorization

Users should only access their own projects.

Never expose another user's data.

---

# Search

Implement instant search.

Search by:

- Name
- Slug
- Description

---

# Sorting

Support:

- Recently Updated
- Recently Created
- Alphabetical
- Framework

---

# Filtering

Support:

- Framework
- Visibility
- Status

---

# UI Improvements

Use the existing design system.

Include:

- Beautiful Empty State
- Hover Animations
- Context Menu
- Dropdown Actions
- Toast Notifications
- Confirmation Dialog before Delete
- Optimistic UI where appropriate

Use Framer Motion for subtle animations.

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- Clean Architecture
- SOLID Principles
- Feature-Based Structure
- Reusable Components

---

# Folder Structure

The Projects feature should contain:

components/

actions/

server/

services/

schemas/

types/

hooks/

utils/

---

# Deliverables

Before writing code:

1. Explain the database design.
2. Explain the Project architecture.
3. Explain CRUD flow.
4. Explain authorization strategy.
5. Explain reusable components.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

- GitHub Integration
- Deployments
- Docker
- Build Queue
- Domains
- Analytics
- Environment Variables
- Workers

Only implement the complete Projects module.

---

# Completion

After implementation:

- Explain every generated file.
- Explain future extensibility.
- Suggest the next feature.
- Wait for further instructions.
