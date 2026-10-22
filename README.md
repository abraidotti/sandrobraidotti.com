# sandrobraidotti.com

Personal site and blog, built with [Astro](https://astro.build). Static output, deployed to S3 by GitHub Actions.

Every post gets a generated picture and tune ("commit song") seeded by the hash of the git commit that created it.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm test          # commit-song determinism tests
npm run build     # type-check + build to dist/
npm run preview
```

## Writing a post

Add `src/content/posts/<slug>.mdx` (or `.md`):

```mdx
---
title: "Post title"
date: 2026-10-21
description: "One line for cards, RSS and meta tags."
tags: ["music"]
draft: false
---

Body text...
```

The post's art and sound come from the commit that **adds** the file. Until you commit it, a stand-in hash is used (the build logs a warning). To embed the post's own player in an `.mdx` post:

```mdx
import CommitSong from '../../components/CommitSong.astro';

<CommitSong hash={props.hash} size="full" />
```

`<CommitSong hash="anything" />` works with any string too.

## How commit songs work

- `src/lib/commitParams.ts`: hash → seeded PRNG → mode, tempo, timbre, perform mode, and an 8-chord voice-led progression (mostly lush, sometimes unsettling) over 32 steps, plus kicks.
- `src/lib/commitArt.ts`: draws those params as an SVG "score" (column = step, height = pitch, shape = chord quality, tail = note length).
- `src/lib/commitAudio.ts`: plays the same params with Web Audio, or renders them to a `.wav` with `OfflineAudioContext`.
- `src/lib/commitPlayer.ts`: the browser-side play/stop/download wiring.

Changing `commitParams` changes every existing song. The snapshot test in `tests/` exists to catch that.

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main` (or manually). It runs `npm test` and `npm run build`, syncs `dist/` to the S3 bucket `abraidotti-sandrobraidotti-com`, then invalidates CloudFront distribution `E2OFL6K1HFCZ4V`. AWS access goes through GitHub OIDC (role `github-actions-sandrobraidotti-com`), so the repo stores no AWS secrets.

CloudFront reads the bucket over REST, which doesn't resolve directory indexes. The viewer-request function in [`infra/cloudfront-rewrite.js`](infra/cloudfront-rewrite.js) maps `/blog/` to `/blog/index.html`. The distribution also serves `/404.html` for missing objects. If you change the function file, republish it in CloudFront; the workflow doesn't deploy it.
