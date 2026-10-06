import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Projects — sanitized pentest summaries only. No targets, creds, client data.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    scope: z.string(),
    methodology: z.array(z.string()),
    tools: z.array(z.string()),
    findingsCount: z.number().int().nonnegative(),
    findings: z
      .array(
        z.object({
          title: z.string(),
          severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']),
          cvss: z.string(),
          description: z.string()
        })
      )
      .default([]),
    remediation: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = { projects, writeups };
