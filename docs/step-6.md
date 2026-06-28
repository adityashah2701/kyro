# Feature 05 — Deployment Engine Foundation

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture, authentication, projects module, GitHub integration, and design system.

---

# Goal

Build the deployment engine foundation.

This feature is responsible for creating and managing deployments.

Do NOT execute Docker builds yet.

Do NOT clone repositories yet.

Do NOT build applications yet.

This feature only establishes the deployment lifecycle, database models, queue architecture, and UI.

---

# Architecture

The deployment system must be event-driven.

The architecture should support horizontal scaling.

Design the system so multiple deployment workers can be added later without changing business logic.

The Next.js application should NEVER perform builds directly.

Its responsibility is only to:

- Validate requests
- Create deployment records
- Push deployment jobs into the queue
- Return responses

Workers will execute deployments later.

---

# Database

Create the Deployment schema.

Fields:

- id (UUID)
- projectId
- userId
- commitSha
- commitMessage
- branch
- status
- triggerType
- deploymentNumber
- buildDuration
- queuedAt
- startedAt
- completedAt
- createdAt
- updatedAt

Status should support:

- queued
- initializing
- cloning
- installing
- building
- uploading
- deploying
- success
- failed
- cancelled

Create proper indexes.

Maintain referential integrity.

---

# Queue Architecture

Initialize BullMQ.

Create:

Deployment Queue

The queue should support:

- Job Creation
- Retry Configuration
- Delayed Jobs
- Job Priority
- Job Cancellation
- Queue Events

Do NOT process jobs yet.

Only initialize the infrastructure.

---

# Deployment Service

Create reusable services.

Responsibilities:

- Create Deployment
- Queue Deployment
- Cancel Deployment
- Retry Deployment
- Fetch Deployment History
- Fetch Deployment Details

Business logic should remain outside UI components.

---

# Deployment Lifecycle

Design a lifecycle that can later support:

Queued

↓

Worker Picked

↓

Clone Repository

↓

Install Dependencies

↓

Build

↓

Upload Artifacts

↓

Activate Deployment

↓

Completed

The lifecycle should be extendable.

---

# Project Integration

Each project should support:

Deploy Button

Deployment History

Latest Deployment

Current Status

Deployment Count

Use placeholder values where execution is not yet implemented.

---

# UI

Create:

Deploy Button

Deployment History Table

Deployment Details Page

Deployment Timeline

Status Badges

Empty State

Loading Skeleton

Error State

Use the existing design system.

---

# Deployment Timeline

Create a reusable timeline component.

Support future stages:

Queued

Initializing

Cloning

Installing

Building

Uploading

Deploying

Completed

Failed

Cancelled

---

# Retry System

Implement UI and backend support.

Do NOT execute retries yet.

Only prepare the architecture.

---

# Permissions

Users may only access deployments belonging to their own projects.

Implement proper authorization.

---

# API

Create server actions for:

Create Deployment

List Deployments

Deployment Details

Cancel Deployment

Retry Deployment

Do NOT execute builds.

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- SOLID Principles
- Clean Architecture
- Modular Services
- Reusable Components
- Feature-Based Structure

---

# Folder Structure

deployment/

components/

actions/

server/

services/

queue/

schemas/

types/

hooks/

utils/

---

# Deliverables

Before writing code:

1. Explain the deployment architecture.
2. Explain why deployments are event-driven.
3. Explain why workers are separate.
4. Explain queue responsibilities.
5. Explain scalability.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

- Docker
- Git Clone
- npm install
- Build Execution
- Live Logs
- Artifact Upload
- Domains
- SSL
- CDN

This feature only creates the deployment foundation.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how workers will plug into this architecture.
- Suggest the next feature.
- Wait for further instructions.
