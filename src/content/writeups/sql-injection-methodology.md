---
title: A Beginner's SQL Injection Testing Methodology (Lab Only)
description: How I structure authorized SQLi testing in labs — enumerate, test safely, validate, score, remediate.
pubDate: 2026-03-10
tags: [SQLi, Methodology, Burp Suite]
---

## Why methodology matters

Random payloads waste time. A repeatable flow — map inputs, test types, validate without damage,
score with CVSS — keeps lab work clean and reportable.

## My lab flow

1. **Map** — list every input: forms, query strings, headers, cookies.
2. **Classify** — error, boolean, time-based, union. Test one hypothesis at a time.
3. **Validate safely** — `SLEEP`-style delays or benign strings. Never dump real data; labs use seeded fake rows.
4. **Score** — CVSS v3.1 base score from a lab-only impact view.
5. **Remediate** — parameterized queries, least privilege, WAF only as defense-in-depth.

## Tools

Burp Suite Repeater/Intruder (throttled), `curl` for baselines, and notes in Markdown so a retest takes minutes.

> All testing described here was performed on self-hosted lab apps.
> Never test systems you do not own or lack written authorization for.
