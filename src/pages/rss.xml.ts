import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('writeups', ({ data }) => !data.draft)).sort(
    (a, b) => +b.data.pubDate - +a.data.pubDate
  );
  return rss({
    title: 'Krish Parajuli — Writeups',
    description: 'Lab-only web security notes.',
    site: context.site ?? 'http://localhost:4321',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `${import.meta.env.BASE_URL}writeups/${p.id}/`
    }))
  });
}
