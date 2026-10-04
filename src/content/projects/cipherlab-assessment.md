---
title: CipherLab Web Application Security Assessment
year: '2026'
summary: Authenticated and unauthenticated testing of a lab build with non-destructive PoCs and fix guidance.
tags: [Web Security, Burp Suite, LFI, File Upload]
featured: true
scope: Self-hosted CipherLab lab application. Authorized testing only in an isolated environment.
methodology:
  - Spidering and content discovery
  - Auth-context comparison (anon vs logged-in)
  - Input validation testing (LFI/path traversal, upload)
  - Evidence capture and retest notes
tools: [Burp Suite, FFUF, curl, Python]
findingsCount: 8
findings:
  - title: LFI / path traversal in download handler (lab)
    severity: High
    cvss: CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (6.5 Medium)
    description: Unsanitized file parameter allowed directory traversal in the lab. Demonstrated by reading a benign planted file only.
  - title: Insecure file upload with weak allow-list (lab)
    severity: High
    cvss: CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:L (7.3 High)
    description: Extension/MIME checks bypassable in the lab build. No shells uploaded; validated with a harmless text marker.
remediation:
  - Allow-list file resolution with canonical-path checks
  - Store uploads outside webroot, serve with safe headers
  - Enforce authentication and per-object authorization
---

## Overview

Assessment of the CipherLab lab app covering both anonymous and logged-in states.
Every proof-of-concept was non-destructive and confined to the lab.

## Attack chain (lab only)

```mermaid
flowchart LR
  A[Map] --> B[Compare auth states]
  B --> C[Test file handlers]
  C --> D[Validate safely]
  D --> E[Report + remediate]
```
