# Feature 09 — Custom Domains & Automatic SSL

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture, deployment engine, storage layer, reverse proxy abstraction, and authentication system.

---

# Goal

Implement a production-grade custom domain management system.

Users should be able to:

- Add custom domains
- Verify domain ownership
- Configure DNS
- Generate SSL certificates automatically
- Route traffic to active deployments

This feature should support future horizontal scaling.

---

# Architecture

The domain system should be provider-independent.

Create abstractions for:

- DNS Verification
- SSL Provider
- Reverse Proxy Provider

The application should never directly depend on Caddy or Nginx.

---

# Database

Create a Domain schema.

Fields:

- id (UUID)
- projectId
- hostname
- isPrimary
- verificationStatus
- sslStatus
- dnsStatus
- certificateProvider
- verifiedAt
- createdAt
- updatedAt

Indexes:

- hostname (unique)
- projectId

---

# Domain Verification

Support:

- Apex Domains
- Subdomains

Verification methods:

- DNS TXT Record
- CNAME Record

The system should generate verification instructions dynamically.

---

# DNS Checker

Implement a DNS verification service.

It should verify:

- CNAME
- A Record
- TXT Record

Store verification status.

Allow users to manually trigger verification.

Prepare for automatic background verification.

---

# SSL

Create an SSL abstraction.

Support:

- Let's Encrypt
- Self-signed (Development)

Automatically issue certificates after successful domain verification.

Support:

- Renewal
- Expiration Tracking
- Revocation

---

# Reverse Proxy

When a domain becomes verified:

Automatically register the route.

Routing:

Incoming Request

↓

Resolve Host

↓

Find Project

↓

Find Active Deployment

↓

Serve Deployment

No application restart should be required.

---

# Primary Domain

Each project may have:

- One Primary Domain
- Multiple Secondary Domains

Support switching the primary domain instantly.

---

# Preview Domains

Preview deployments should continue using generated preview URLs.

Custom domains should always point to the active production deployment.

---

# Rollback

Rolling back a deployment should not require reconfiguring domains.

Domains must automatically point to the newly active deployment.

---

# UI

Create:

Domains Page

Add Domain Modal

DNS Instructions Card

Verification Status

SSL Status

Certificate Information

Primary Domain Badge

Delete Domain Dialog

Retry Verification Button

Refresh Status Button

Copy DNS Records

---

# Status

Support:

Pending

Verifying

Verified

SSL Issuing

Ready

Failed

Expired

---

# Error Handling

Handle:

Invalid Domain

Duplicate Domain

DNS Not Configured

Certificate Failure

Verification Timeout

Reverse Proxy Failure

Show meaningful error messages.

---

# Security

Validate:

Domain Ownership

Duplicate Domains

Reserved Domains

Invalid Hostnames

Prevent:

Host Header Attacks

Domain Hijacking

Improper Certificate Issuance

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- SOLID Principles
- Dependency Injection
- Clean Architecture
- Reusable Services

---

# Folder Structure

domains/

components/

actions/

services/

providers/

schemas/

types/

hooks/

utils/

---

# Deliverables

Before writing code:

1. Explain the domain architecture.
2. Explain DNS verification.
3. Explain SSL issuance.
4. Explain reverse proxy registration.
5. Explain security considerations.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

Analytics

Edge CDN

Global Load Balancer

Autoscaling

Billing

Monitoring Dashboard

Only implement custom domains and automatic SSL.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how a custom domain becomes live.
- Explain how SSL certificates are renewed.
- Suggest the next feature.
- Wait for further instructions.
