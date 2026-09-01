#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch.
# GitHub Pages for this repo serves that branch at
# https://dattheshshenoy.github.io/roomwright/
#
# This is the manual path. To switch to CI (deploy on every push to main),
# run once:  gh auth refresh -h github.com -s workflow
# then add .github/workflows/pages.yml (see docs/DEPLOY.md).
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
touch dist/.nojekyll

WT="$(mktemp -d)"
git worktree add -B gh-pages "$WT" >/dev/null
find "$WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. "$WT"/
(
  cd "$WT"
  git add -A
  git commit -q -m "deploy $(git -C "$OLDPWD" rev-parse --short HEAD)" || { echo "nothing to deploy"; exit 0; }
  git push -q -u origin gh-pages --force
)
git worktree remove --force "$WT"
git branch -D gh-pages >/dev/null 2>&1 || true
echo "deployed -> https://dattheshshenoy.github.io/roomwright/"
