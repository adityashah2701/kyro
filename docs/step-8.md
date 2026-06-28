# Feature 07 — Build Execution Engine

You are continuing the existing project.

Do NOT regenerate previous features.

Use the existing architecture.

This feature extends the Build Worker.

---

# Goal

Implement the actual deployment execution pipeline.

The worker should be capable of building modern JavaScript applications inside isolated Docker containers.

The output should be production-ready build artifacts.

Do NOT implement domains, SSL, or serving the application yet.

---

# Build Pipeline

Implement the complete deployment lifecycle.

Deployment

↓

Clone Repository

↓

Checkout Branch

↓

Detect Framework

↓

Install Dependencies

↓

Run Build Command

↓

Collect Artifacts

↓

Store Metadata

↓

Cleanup

---

# Git

Clone repositories using Git.

Support:

- Public repositories
- Private repositories
- GitHub App authentication

Checkout the selected branch.

Validate repository access.

Handle clone failures gracefully.

---

# Framework Detection

Automatically detect the project.

Support:

- Next.js
- React (Vite)
- React (CRA)
- Vue
- Nuxt
- Astro
- Remix
- SvelteKit
- Angular
- Static HTML

Detect using:

package.json

Configuration files

Lock files

Project structure

Allow manual override later.

---

# Package Manager Detection

Automatically detect:

npm

pnpm

yarn

bun

Install dependencies using the detected package manager.

---

# Node Version

Support reading:

package.json engines

.nvmrc

Default Node version

Download or use the correct Node version.

---

# Build Commands

Automatically determine:

Install Command

Build Command

Output Directory

Support custom commands in the future.

---

# Docker

Execute everything inside an isolated container.

The container must:

- Have internet access
- Have limited resources
- Be removed after completion

Never execute builds on the host machine.

---

# Output

Collect:

Build Folder

Logs

Framework

Build Duration

Build Size

Node Version

Package Manager

Store metadata in the database.

---

# Failure Handling

Handle:

Dependency installation failures

Missing package.json

Unsupported framework

Invalid build command

Missing output directory

Out of memory

Timeout

Network failure

Container crash

Provide detailed failure reasons.

---

# Security

Never expose:

GitHub tokens

Environment variables

Secrets

Never allow arbitrary shell execution outside controlled build commands.

---

# Logging

Log every stage.

Examples:

Repository cloned

Framework detected

Dependencies installed

Build started

Build completed

Artifacts collected

Cleanup completed

---

# Progress Updates

Continuously update deployment status.

Support:

Queued

Cloning

Installing

Building

Collecting Artifacts

Completed

Failed

These updates should integrate with the existing deployment timeline.

---

# Code Quality

Follow:

- Strict TypeScript
- No any
- SOLID Principles
- Modular Architecture
- Reusable Services
- Testable Worker Logic

---

# Deliverables

Before writing code:

1. Explain the deployment execution pipeline.
2. Explain framework detection.
3. Explain package manager detection.
4. Explain Docker execution.
5. Explain security considerations.

Then generate the implementation.

---

# Do NOT Implement

Do NOT implement:

- Serving deployments
- Reverse Proxy
- Domains
- SSL
- CDN
- Live Deployment Logs UI

Only implement the build execution engine.

---

# Completion

After implementation:

- Explain every generated file.
- Explain how artifacts will be served in the next feature.
- Suggest the next feature.
- Wait for further instructions.
