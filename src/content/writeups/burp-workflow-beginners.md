---
title: My Burp Suite Workflow as a Student
description: Project setup, scope, Repeater discipline, and reporting habits that keep assessments tidy.
pubDate: 2026-01-20
tags: [Burp Suite, Workflow]
---

## Setup

One Burp project per lab. Scope limited to the lab host. Logging on so every request is replayable.

## During testing

- Proxy everything, but send only interesting requests to Repeater.
- Name each Repeater tab by hypothesis (`sqli-search`, `idor-profile`).
- Throttle Intruder in shared labs; prefer manual Repeater checks.

## After testing

Export findings into the Markdown report template with CVSS v3.1 fields, then retest each fix once.
