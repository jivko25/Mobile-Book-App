#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function run(command, options = {}) {
  const inherit = Boolean(options.inherit);
  const result = execSync(command, {
    cwd: root,
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: inherit ? undefined : 'utf8',
  });
  if (inherit) return '';
  return (result ?? '').trim();
}

function hasChanges() {
  const status = run('git status --porcelain');
  return status.length > 0;
}

function publishRelease(version) {
  if (process.env.SKIP_RELEASE_PUSH === '1') {
    console.log('SKIP_RELEASE_PUSH=1 — skipping git commit/push.');
    return;
  }

  try {
    run('git rev-parse --git-dir');
  } catch {
    console.warn('Not a git repository — skipping publish.');
    return;
  }

  if (!hasChanges()) {
    console.log('No release files changed — skipping git commit/push.');
    return;
  }

  run('git add README.md package.json app.json releases/', { inherit: true });

  const message = `release: v${version} android apk`;
  try {
    run(`git commit -m "${message}"`, { inherit: true });
  } catch {
    console.warn('Git commit skipped (nothing to commit or commit failed).');
    return;
  }

  try {
    run('git push origin HEAD', { inherit: true });
    console.log(`\n✓ Release v${version} pushed to GitHub.\n`);
  } catch (error) {
    console.warn(
      '\nBuild succeeded but git push failed. Push manually when ready:\n  git push origin HEAD\n',
    );
    if (error.stdout) console.warn(error.stdout);
    if (error.stderr) console.warn(error.stderr);
  }
}

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/publish-release.js <version>');
  process.exit(1);
}

publishRelease(version);
