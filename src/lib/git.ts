// Build-time git helpers. CI must check out with full history (fetch-depth: 0).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const REPO_URL = 'https://github.com/abraidotti/sandrobraidotti.com';

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export interface CreationHash {
  hash: string;
  /** False when the file isn't committed yet and the hash is a stand-in. */
  committed: boolean;
}

const cache = new Map<string, CreationHash>();

/** Hash of the commit that first added `filePath` (following renames). */
export function creationHash(filePath: string): CreationHash {
  const cached = cache.get(filePath);
  if (cached) return cached;

  const hashes = git(['log', '--follow', '--diff-filter=A', '--format=%H', '--', filePath]).split('\n').filter(Boolean);
  let result: CreationHash;
  if (hashes.length) {
    result = { hash: hashes[hashes.length - 1], committed: true };
  } else {
    console.warn(`[commit-song] ${filePath} is not committed yet; using a stand-in hash.`);
    result = { hash: createHash('sha1').update(`uncommitted:${filePath}`).digest('hex'), committed: false };
  }
  cache.set(filePath, result);
  return result;
}

export interface Commit {
  hash: string;
  author: string;
  date: Date;
  subject: string;
  url: string;
}

export function recentCommits(limit = 30): Commit[] {
  const out = git(['log', `-n${limit}`, '--no-merges', '--format=%H%x1f%an%x1f%aI%x1f%s%x1e']);
  return out
    .split('\x1e')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, subject] = line.split('\x1f');
      return { hash, author, date: new Date(date), subject, url: `${REPO_URL}/commit/${hash}` };
    });
}
