# Feature 06 — Docker Build Worker

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture.

This feature must be implemented as a completely separate service.

The Next.js application must NEVER execute builds.

---

# Goal

Build a production-ready Build Worker.

The worker is responsible for executing deployment jobs.

The worker should listen to BullMQ and process deployment jobs independently.

The worker must be horizontally scalable.

Multiple workers should be able to run simultaneously.

---

# Architecture

Create a separate worker application.

Suggested structure:

apps/

```
web/

worker/
```

packages/

```
shared/
```

Do NOT tightly couple the worker with Next.js.

Communication should happen only through:

- PostgreSQL
- Redis
- BullMQ

---

# Responsibilities

The worker should:

- Listen for deployment jobs
- Reserve a job
- Update deployment status
- Execute the deployment lifecycle
- Report progress
- Report failures
- Cleanup resources

---

# Docker

Use Docker Engine.

The worker should create an isolated container for every deployment.

Every deployment must run inside a fresh container.

Never reuse containers.

Destroy the container after completion.

---

# Resource Limits

Support:

- CPU Limits
- Memory Limits
- Disk Limits
- Timeout Limits

Design these as configurable values.

---

# Deployment Workspace

For every deployment:

Create:

/tmp/deployments/{deploymentId}

Store:

Repository

Logs

Build Files

Temporary Files

Automatically clean everything after completion.

---

# Deployment Lifecycle

Implement:

Queued

↓

Initializing

↓

Preparing Workspace

↓

Container Started

↓

Repository Ready

↓

Dependencies Installed

↓

Build Finished

↓

Artifacts Ready

↓

Cleanup

↓

Completed

Every stage should update the database.

---

# Status Updates

The worker should continuously update:

- Status
- Progress
- Started Time
- Finished Time
- Duration

Prepare the architecture for real-time updates.

---

# Logging

Create a structured logger.

Support:

INFO

WARN

ERROR

DEBUG

Every deployment should have isolated logs.

---

# Failure Handling

Handle:

Container Crash

Timeout

Disk Full

Memory Limit

CPU Limit

Unexpected Exceptions

Gracefully clean resources.

Never leave orphan containers.

---

# Configuration

Use environment variables.

Examples:

MAX_BUILD_TIME

MAX_MEMORY

MAX_CPU

TEMP_DIRECTORY

DOCKER_SOCKET

REDIS_URL

DATABASE_URL

---

# Shared Package

Move shared types into packages/shared.

Examples:

Deployment Status

Queue Types

Worker Types

Shared DTOs

Validation Schemas

Do not duplicate types.

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- SOLID Principles
- Dependency Injection
- Feature-Based Structure
- Clean Architecture

Worker logic must be testable.

---

# Deliverables

Before writing code:

1. Explain worker architecture.
2. Explain why it is separated.
3. Explain Docker lifecycle.
4. Explain cleanup strategy.
5. Explain scalability.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

- Git Clone
- Framework Detection
- npm install
- Build Commands
- Artifact Upload
- Domains
- SSL
- CDN

Only implement the Build Worker foundation.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how multiple workers will scale.
- Explain how the next feature will plug into this worker.
- Wait for further instructions.
