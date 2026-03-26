# Binary Ventures Website V2 Workflows

## Current Workflow — Strategy First

1. Finalize positioning
2. Finalize sitemap
3. Finalize page copy
4. Finalize component request roles
5. Begin design and implementation

## Component Selection Workflow

1. Approve the page structure
2. Identify the exact role a component needs to play
3. Request only the needed component type
4. Adapt it to the V2 visual and content system

## Implementation Workflow

1. Build shared layout
2. Build page shells
3. Insert approved content structure
4. Refine responsive design
5. Polish motion, accessibility, and performance

## Content Update Workflow

1. Update the relevant doc first if messaging strategy changes
2. Then update page copy
3. Then update design or implementation

## Deploy Workflow

Hosting: Firebase Hosting, site `binaryventures-in`, project `store-pos-44750` → `www.binaryventures.in`

```bash
cd "Websites/binaryventures.in V2"
npm run build
firebase deploy --only hosting:binaryventures-in
```

- `next.config.ts` has `output: "export"` — builds to `out/`
- `firebase.json` uses `cleanUrls: true` (serves `/work` not `/work/index.html`)
- No server runtime — fully static export
