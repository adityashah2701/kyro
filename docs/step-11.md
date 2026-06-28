# Feature 10 — Environment Variables & Secrets Management

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture, authentication, projects, deployments, GitHub integration, and deployment engine.

---

# Goal

Implement a production-grade Environment Variables & Secrets Management system.

The system should securely store, encrypt, manage, version, and inject environment variables into deployments.

This feature should be designed for future enterprise scaling.

---

# Architecture

Environment variables should never be stored in plain text.

Design a pluggable Secret Provider architecture.

Support multiple providers in the future.

Examples:

- Local Encrypted Storage
- HashiCorp Vault
- AWS Secrets Manager
- Google Secret Manager
- Azure Key Vault

Initially implement Local Encrypted Storage.

---

# Database

Create an EnvironmentVariable model.

Fields:

- id (UUID)
- projectId
- key
- encryptedValue
- environment
- isSecret
- createdBy
- createdAt
- updatedAt

Indexes:

- projectId
- environment

Never store raw values.

---

# Encryption

Encrypt values before storing them.

Use AES-256-GCM.

The encryption key must come from an environment variable.

Never hardcode encryption keys.

Implement:

Encrypt()

Decrypt()

RotateKeys()

Prepare for future key rotation.

---

# Environments

Support:

Development

Preview

Production

Users should be able to create variables for each environment independently.

---

# Variable Injection

During deployment:

Worker

↓

Fetch Variables

↓

Decrypt

↓

Generate .env

↓

Inject into Docker Container

↓

Delete Temporary .env after Build

Secrets should never remain on disk after deployment.

---

# UI

Create a dedicated Environment Variables page.

Support:

- Add Variable
- Edit Variable
- Delete Variable
- Duplicate Variable
- Search
- Filter by Environment
- Bulk Delete

Hide secret values by default.

Provide:

Show

Hide

Copy

Reveal (temporarily)

---

# Import & Export

Support importing:

.env files

Support exporting:

.env.example

Do NOT export secret values.

Only export keys.

---

# Validation

Validate:

Duplicate Keys

Invalid Keys

Reserved Keys

Maximum Length

Allowed Characters

---

# Audit Trail

Track:

Created By

Updated By

Created Time

Updated Time

Future-ready for:

Version History

Rollback

---

# Security

Prevent:

Secret Leakage

Logging Secret Values

Client-side Decryption

Browser Storage

Implement:

Server-side Decryption Only

Secure API Responses

Role-based Access

---

# Worker Integration

Workers should receive secrets only during deployment.

Never permanently cache decrypted values.

Destroy decrypted values after deployment.

---

# API

Implement:

Create Variable

Update Variable

Delete Variable

Get Variables

Duplicate Variable

Search Variables

---

# UI Improvements

Use existing design system.

Include:

Empty States

Loading Skeletons

Search

Filter

Animated Dialogs

Confirmation Dialog

Toast Notifications

Responsive Layout

Keyboard Shortcuts

---

# Code Quality

Follow:

Strict TypeScript

No any

SOLID Principles

Dependency Injection

Reusable Services

Clean Architecture

Feature-Based Structure

---

# Folder Structure

environment/

components/

actions/

services/

providers/

crypto/

schemas/

types/

hooks/

utils/

---

# Deliverables

Before writing code:

1. Explain the secret management architecture.
2. Explain encryption strategy.
3. Explain worker integration.
4. Explain security model.
5. Explain future secret providers.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

Vault Integration

AWS Secret Manager

Google Secret Manager

RBAC

Teams

Organizations

CLI

Analytics

Only implement local encrypted secrets management.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how secrets remain secure.
- Explain how future providers can be added.
- Suggest the next feature.
- Wait for further instructions.
