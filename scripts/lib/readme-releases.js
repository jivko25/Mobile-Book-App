const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const readmePath = path.join(root, 'README.md');
const manifestPath = path.join(root, 'releases', 'manifest.json');
const START = '<!-- APK_RELEASES_START -->';
const END = '<!-- APK_RELEASES_END -->';
const REPO = 'jivko25/Mobile-Book-App';
const BRANCH = 'main';

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    return { releases: [] };
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function saveManifest(manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function addRelease(entry) {
  const manifest = loadManifest();
  const filtered = manifest.releases.filter(
    (item) =>
      !(
        item.version === entry.version &&
        item.variant === entry.variant &&
        item.fileName === entry.fileName
      ),
  );
  manifest.releases = [entry, ...filtered];
  saveManifest(manifest);
  return manifest;
}

function formatDate(iso) {
  return iso.slice(0, 10);
}

function buildTable(releases) {
  if (releases.length === 0) {
    return [
      '| Version | Build | APK | Date | Size |',
      '| --- | --- | --- | --- | --- |',
      '| _No releases yet_ | — | — | — | — |',
    ].join('\n');
  }

  const lines = [
    '| Version | Build | APK | Date | Size |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const item of releases) {
    const url = `https://github.com/${REPO}/raw/${BRANCH}/releases/${item.fileName}`;
    const label = item.variant === 'debug' ? 'Debug' : 'Release';
    lines.push(
      `| **${item.version}** | ${item.versionCode} (${label}) | [Download](${url}) | ${formatDate(item.builtAt)} | ${item.sizeMb} MB |`,
    );
  }

  return lines.join('\n');
}

function updateReadme(manifest) {
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md not found');
  }

  const readme = fs.readFileSync(readmePath, 'utf8');
  const table = buildTable(manifest.releases);
  const block = `${START}\n${table}\n${END}`;

  if (!readme.includes(START) || !readme.includes(END)) {
    throw new Error('README.md is missing APK release markers');
  }

  const next = readme.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    block,
  );
  fs.writeFileSync(readmePath, next);
}

module.exports = {
  addRelease,
  loadManifest,
  updateReadme,
};
