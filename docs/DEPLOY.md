# Deploy

Live: **https://dattheshshenoy.github.io/roomwright/**

Static Vite build (`base: "./"`, so a project-page subpath works). No backend.

## Current setup — GitHub Pages from a branch

Pages serves the `gh-pages` branch at the URL above. To redeploy after a change:

```bash
npm run deploy
```

That builds `dist/`, drops a `.nojekyll`, and force-pushes it to `gh-pages`.
GitHub rebuilds the site in ~30–60 s.

## Optional — deploy on every push (CI)

The `gh` CLI OAuth token used here lacks the `workflow` scope, so a workflow
file under `.github/workflows/` can't be pushed from this machine. To switch to
push-to-deploy:

1. `gh auth refresh -h github.com -s workflow`
2. Add `.github/workflows/pages.yml`:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push: { branches: [main] }
     workflow_dispatch:
   permissions: { contents: read, pages: write, id-token: write }
   concurrency: { group: pages, cancel-in-progress: false }
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: npm }
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
       steps:
         - id: d
           uses: actions/deploy-pages@v4
   ```

3. Repo Settings → Pages → Source: **GitHub Actions**.

## Alternative hosts

`netlify.toml` and `public/_redirects` are committed, so Netlify or Cloudflare
Pages deploy with zero extra config (build `npm run build`, publish `dist`).
Worth keeping a second host live during judging as a backup.
