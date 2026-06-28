# Bug Fix — Environment Variables Import & Parsing

You are continuing the existing project.

Do NOT regenerate previous features.

Only fix and improve the existing Environment Variables module.

---

# Goal

The current implementation has multiple usability and parsing issues.

Fix these issues while preserving the existing architecture.

---

# Issue 1 — Hidden .env Files Cannot Be Uploaded

Problem:

The import feature only allows selecting files through the native file picker.

On macOS and Linux, `.env` files are hidden by default, making them difficult to select.

Implement support for:

- Drag & Drop
- File Upload
- Paste from Clipboard

Users should never be forced to rename `.env` files.

Support dropping hidden files directly into the browser.

---

# Issue 2 — Paste .env Content

Currently, pasting a complete `.env` file into the textarea does not correctly populate the key-value editor.

Implement a robust parser.

Example input:

DATABASE_URL=postgres://localhost:5432/db

REDIS_URL=redis://localhost:6379

NODE_ENV=production

API_KEY="abcdef"

NEXT_PUBLIC_API=https://example.com

EMPTY=

MULTILINE="hello
world"

# Comment

The parser should create proper rows automatically.

---

# Parser Requirements

Support:

✔ Empty lines

✔ Comments

✔ Spaces around "="

✔ Quotes

✔ Single Quotes

✔ Double Quotes

✔ Escaped Quotes

✔ Empty Values

✔ UTF-8 Characters

✔ Duplicate Detection

✔ Multiline Values

✔ Exported Variables

Example:

export DATABASE_URL=...

should parse correctly.

---

# Validation

Detect:

Duplicate Keys

Invalid Variable Names

Malformed Entries

Reserved Variables

Display meaningful validation errors.

---

# Bulk Import

After parsing:

Show a preview table.

Columns:

Key

Value (masked if secret)

Environment

Status

Allow:

Import All

Skip Invalid

Edit Before Import

Cancel

---

# UI Improvements

Replace the current upload dialog.

Create three tabs:

1. Manual

2. Paste .env

3. Upload File

The upload tab should support:

- Drag & Drop
- Click to Upload
- Replace File

The paste tab should include:

Large code editor

Syntax highlighting (if feasible)

Auto Parsing

Live Validation

---

# File Support

Support importing:

.env

.env.local

.env.production

.env.development

.env.preview

.env.example

txt

Reject unsupported formats.

---

# Export

Improve export functionality.

Support:

Download .env

Download .env.example

Download Selected Variables

Never expose encrypted values unless explicitly revealed by the user.

---

# UX

Show:

Import Summary

Imported Variables

Skipped Variables

Duplicate Variables

Validation Errors

Success Toast

Progress Indicator

---

# Security

Never log secrets.

Never expose decrypted values unnecessarily.

Never cache pasted secrets in localStorage.

---

# Code Quality

Follow:

Strict TypeScript

No any

Reusable Parser

Unit-Testable Parser

Clean Architecture

Feature-Based Structure

---

# Deliverables

Before writing code:

1. Explain why the previous parser failed.
2. Explain the new parser design.
3. Explain drag-and-drop support.
4. Explain validation strategy.
5. Explain security considerations.

Then implement the fixes.

Do NOT modify unrelated features.

After implementation, explain every changed file and why it was updated.
