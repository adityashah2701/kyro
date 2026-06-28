# Feature 04 — GitHub Integration

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture, authentication, database, and UI system.

---

# Goal

Implement a production-ready GitHub integration.

Users should be able to connect their GitHub account, install our GitHub App, import repositories, and prepare projects for deployment.

Do NOT implement deployment yet.

---

# Architecture

Use a GitHub App for repository access.

Use Better Auth only for authentication.

Separate authentication from repository authorization.

The architecture should support:

- Personal repositories
- Organization repositories
- Private repositories
- Multiple GitHub installations

---

# Features

Implement:

- Connect GitHub Account
- Disconnect GitHub Account
- Install GitHub App
- Detect Installation
- Repository Import
- Repository Search
- Branch Selection
- Repository Refresh

---

# Database

Create the necessary tables.

Suggested entities:

GitHub Account

- id
- userId
- githubUserId
- username
- avatar
- installationId
- connectedAt
- updatedAt

Project Repository

- id
- projectId
- repositoryId
- repositoryName
- owner
- defaultBranch
- selectedBranch
- private
- cloneUrl
- createdAt

Design the schema for future scalability.

---

# GitHub API

Implement server-side utilities.

Support:

- Fetch repositories
- Search repositories
- Fetch branches
- Validate installation
- Refresh repository list

Never expose GitHub tokens to the client.

---

# UI

Create a GitHub integration page.

Include:

- Connection Status
- Connect Button
- Disconnect Button
- Install GitHub App Button
- Refresh Button

---

# Repository Import

Create a beautiful repository picker.

Features:

- Search
- Infinite scrolling (if required)
- Repository badges
- Private/Public badge
- Organization badge
- Recently updated

Each repository card should display:

- Repository Name
- Owner
- Visibility
- Default Branch
- Last Updated

---

# Branch Selector

Allow selecting the deployment branch.

Default:

main

Support changing later.

---

# Project Integration

Every project should support:

- Link Repository
- Change Repository
- Change Branch
- Disconnect Repository

---

# Error Handling

Handle:

- Missing GitHub App Installation
- Expired Tokens
- Missing Permissions
- API Limits
- Network Errors
- Invalid Repository

Display friendly error messages.

---

# Security

Implement:

- Server-side API calls only
- Encrypted token storage if required
- Secure callback validation
- Proper permission verification

Never expose secrets to the browser.

---

# UI Improvements

Use the existing design system.

Include:

- Loading Skeletons
- Empty States
- Toast Notifications
- Smooth Animations
- Optimistic Updates
- Responsive Layout

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- SOLID Principles
- Feature-Based Architecture
- Reusable Components
- Modular Services

---

# Deliverables

Before writing code:

1. Explain why GitHub App is preferred.
2. Explain the authentication flow.
3. Explain repository authorization.
4. Explain the database design.
5. Explain security considerations.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

- Docker Builds
- Deployment Engine
- Workers
- Build Queue
- Live Logs
- Domains
- SSL
- Analytics

Only implement GitHub integration.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how this prepares the platform for deployments.
- Suggest the next feature.
- Wait for further instructions.
