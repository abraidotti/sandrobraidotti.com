// Build-time git helpers. CI must check out with full history (fetch-depth: 0).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { FAST_FORWARDS, type FastForward } from './fastForwards.ts';

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

const COMMIT_FORMAT = '--format=%H%x1f%an%x1f%aI%x1f%s%x1f%P%x1e';

function parseCommits(out: string): (Commit & { parents: string[] })[] {
  return out
    .split('\x1e')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, subject, parents = ''] = line.split('\x1f');
      return { hash, author, date: new Date(date), subject, url: `${REPO_URL}/commit/${hash}`, parents: parents.split(' ').filter(Boolean) };
    });
}

export function recentCommits(limit = 30): Commit[] {
  return parseCommits(git(['log', `-n${limit}`, '--no-merges', COMMIT_FORMAT]));
}

/**
 * The branch a merge commit brought in, read from its message: "Merge branch 'x'" or
 * "Merge pull request #18 from owner/x". Null when it isn't a feature branch: merges that only
 * sync main (or master) with itself, or a message we don't recognise.
 */
export function branchName(subject: string): string | null {
  const pr = subject.match(/^Merge pull request #\d+ from [^/\s]+\/(\S+)/);
  if (pr) return pr[1];
  const branch = subject.match(/^Merge (?:remote-tracking )?branch '([^']+)'/);
  if (!branch) return null;
  const name = branch[1].replace(/^origin\//, '');
  return name === 'main' || name === 'master' ? null : name;
}

export interface MergedBranch {
  name: string;
  /** The merge commit, or for a fast-forwarded branch its last commit. */
  merge: Commit;
  /** The branch's own commits, newest first. */
  commits: Commit[];
}

export type TimelineEntry = { kind: 'commit'; commit: Commit } | { kind: 'branch'; branch: MergedBranch };

/**
 * Main's own line of history, newest first: commits made directly on main, and each merged branch
 * at the point it was merged. Fast-forwarded branches sit on main's line in git; they are lifted out
 * of it and shown as the branches they were.
 */
export function mainTimeline(fastForwards: FastForward[] = FAST_FORWARDS): TimelineEntry[] {
  const strip = ({ parents: _, ...commit }: Commit & { parents: string[] }): Commit => commit;
  const between = (from: string, to: string) => parseCommits(git(['log', '--no-merges', COMMIT_FORMAT, `${from}..${to}`])).map(strip);

  const forwardedAt = new Map(fastForwards.map((ff) => [ff.tip, ff]));
  const forwarded = new Set(fastForwards.flatMap((ff) => between(ff.base, ff.tip).map((c) => c.hash)));

  const entries: TimelineEntry[] = [];
  for (const commit of parseCommits(git(['log', '--first-parent', COMMIT_FORMAT]))) {
    const ff = forwardedAt.get(commit.hash);
    const name = branchName(commit.subject);
    const [into, from] = commit.parents;
    if (ff) {
      entries.push({ kind: 'branch', branch: { name: ff.name, merge: strip(commit), commits: between(ff.base, ff.tip) } });
    } else if (name && from) {
      entries.push({ kind: 'branch', branch: { name, merge: strip(commit), commits: between(into, from) } });
    } else if (!forwarded.has(commit.hash)) {
      entries.push({ kind: 'commit', commit: strip(commit) });
    }
  }
  return entries;
}
