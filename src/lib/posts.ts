import { getCollection, type CollectionEntry } from 'astro:content';
import { creationHash } from './git.ts';

export type Post = CollectionEntry<'posts'> & { hash: string };

/** Published posts, newest first, each with the hash of the commit that created it. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts
    .map((post) => ({ ...post, hash: creationHash(post.filePath ?? post.id).hash }))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return date.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}
