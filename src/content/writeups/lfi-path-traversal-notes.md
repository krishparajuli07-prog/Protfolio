---
title: LFI and Path Traversal Notes from the Lab
description: Canonical-path checks, allow-lists, and safe non-destructive validation for file-handling bugs.
pubDate: 2026-02-14
tags: [LFI, Path Traversal, Remediation]
---

## The pattern

File handlers that concatenate user input into a path are the classic setup.
In labs I look for `file=`, `page=`, `download=` parameters and test traversal against a planted benign file —
never `/etc/passwd` on real hosts.

## Safe validation

- Request a known planted marker file via `../` sequences and encoded variants.
- Confirm canonical-path resolution server-side would block it.
- Stop at read proof; no further pivoting in shared environments.

## Fix guidance

Resolve to a canonical path, verify it stays under an allow-listed directory,
and serve downloads with `Content-Disposition: attachment` plus strict MIME handling.
