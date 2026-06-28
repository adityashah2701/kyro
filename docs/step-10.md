# Feature 08 — Deployment Serving Engine

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture.

This feature is responsible for serving successfully built deployments.

The deployment engine already produces build artifacts.

Now those artifacts need to become publicly accessible.

---

# Goal

Build a production-grade deployment serving system.

This feature should expose deployed applications using wildcard subdomains.

The system should support future horizontal scaling.

---

# High-Level Architecture

Deployment Finished

↓

Artifacts Generated

↓

Upload Artifacts

↓

Store Deployment Metadata

↓

Generate Preview URL

↓

Register Reverse Proxy

↓

Deployment Live

---

# Artifact Storage

Implement an abstraction layer.

Support:

- Local Storage (Development)
- MinIO
- Amazon S3 (Future)
- Cloudflare R2 (Future)
- Google Cloud Storage (Future)

Storage providers should be swappable without changing business logic.

Create a Storage interface.

---

# Deployment Artifacts

Store:

Static Files

Metadata

Build Manifest

Framework Information

Deployment Size

Deployment Hash

Output Directory

Checksum

Created Time

---

# Preview URLs

Generate unique preview URLs.

Example:

project-name-randomhash.localhost

Later this should become:

project-name-randomhash.kyro.dev

Preview URLs must be immutable.

Every deployment gets its own preview URL.

---

# Active Deployment

Every project has:

Current Production Deployment

Previous Deployment

Deployment History

Implement active deployment switching.

Support instant rollback.

---

# Reverse Proxy

Implement a reverse proxy abstraction.

Support:

- Caddy
- Nginx

Design the architecture so proxy providers can be swapped.

The deployment service should never depend directly on Nginx.

---

# Routing

Incoming Request

↓

Extract Host

↓

Find Deployment

↓

Resolve Active Deployment

↓

Serve Build Files

↓

Return Response

---

# Static File Serving

Serve:

HTML

CSS

JavaScript

Fonts

Images

Assets

Support proper MIME types.

Support compression.

Support cache headers.

---

# Framework Support

Support serving:

React

Next.js Static Export

Vue

Astro

Vite

Angular

Nuxt Static

Svelte

Static HTML

Design the architecture for future SSR support.

---

# Rollback

Implement:

Activate Deployment

Deactivate Deployment

Rollback

Instant switching

Rollback should never rebuild the application.

---

# Cleanup

Old deployments should remain stored.

Implement configurable cleanup policies.

Examples:

Keep Last 20 Deployments

Delete Deployments Older Than 30 Days

Cleanup should never remove active deployments.

---

# Security

Prevent:

Directory Traversal

Invalid Hosts

Unknown Preview URLs

Unauthorized Access

Malformed Requests

---

# UI

Create:

Deployment Details

Preview URL Card

Open Deployment Button

Copy URL Button

Activate Deployment

Rollback Deployment

Deployment Status

Storage Information

Artifact Information

---

# Database

Extend Deployment model.

Add:

previewUrl

artifactLocation

artifactSize

storageProvider

active

activatedAt

checksum

---

# Services

Create:

Storage Service

Artifact Service

Proxy Service

Deployment Activation Service

Deployment Routing Service

---

# Code Quality

Follow:

Strict TypeScript

No any

SOLID Principles

Dependency Injection

Reusable Services

Feature-Based Structure

Clean Architecture

---

# Deliverables

Before writing code:

1. Explain the serving architecture.
2. Explain storage abstraction.
3. Explain reverse proxy architecture.
4. Explain preview URL generation.
5. Explain rollback strategy.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

Live Logs

Custom Domains

SSL

Analytics

Monitoring

Edge Network

CDN

Only implement deployment serving.

---

# Completion

After implementation:

Explain every generated file.

Explain how production deployment works.

Suggest the next feature.

Wait for further instructions.
