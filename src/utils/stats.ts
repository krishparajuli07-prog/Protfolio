import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';

export interface Stats {
  projectsCompleted: number;
  findingsDocumented: number;
  certificationsCompleted: number;
  tryhackmeRank: string;
}

export async function buildStats(): Promise<Stats> {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  const findings = projects.reduce((n, p) => n + (p.data.findingsCount ?? 0), 0);
  let certs: Array<{ status: string }> = [];
  try {
    const raw = await readFile(new URL('../data/certifications.json', import.meta.url), 'utf8');
    certs = JSON.parse(raw);
  } catch {
    certs = [];
  }
  const completed = certs.filter((c) => c.status === 'Complete').length;
  return {
    projectsCompleted: projects.length,
    findingsDocumented: findings,
    certificationsCompleted: completed,
    tryhackmeRank: 'Top 100 Nepal'
  };
}
