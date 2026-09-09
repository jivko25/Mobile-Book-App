const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const pkgPath = path.join(root, 'package.json');
const appPath = path.join(root, 'app.json');

function bumpPatch(version) {
  const parts = version.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid semver: ${version}`);
  }
  parts[2] += 1;
  return parts.join('.');
}

function readVersions() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
  const versionCode = app.expo.android?.versionCode ?? 1;
  return {
    version: pkg.version,
    versionCode,
  };
}

function writeVersions(version, versionCode) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

  pkg.version = version;
  app.expo.version = version;
  app.expo.android = {
    ...app.expo.android,
    versionCode,
  };

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);
}

function bumpVersion() {
  const current = readVersions();
  const nextVersion = bumpPatch(current.version);
  const nextCode = current.versionCode + 1;
  writeVersions(nextVersion, nextCode);
  return { version: nextVersion, versionCode: nextCode };
}

module.exports = {
  bumpPatch,
  bumpVersion,
  readVersions,
  writeVersions,
};
