#!/usr/bin/env node
/**
 * Windows-compatible local Android APK build.
 *
 * Default: reuses existing android/ (no expo prebuild) — avoids Windows EBUSY locks.
 * Use --fresh to regenerate native project from scratch.
 *
 * Flags:
 *   --fresh       delete android/ and run expo prebuild
 *   --debug       debug APK, no version bump, no publish
 *   --no-bump     skip version bump
 *   --no-publish  skip git commit/push
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { bumpVersion, readVersions } = require('./lib/version');
const { addRelease, updateReadme } = require('./lib/readme-releases');
const {
  androidDir,
  gradlewName,
  prepareAndroidProject,
  stopGradle,
} = require('./lib/android-project');

const root = path.join(__dirname, '..');
const releasesDir = path.join(root, 'releases');
const isDebug = process.argv.includes('--debug');
const skipBump = process.argv.includes('--no-bump');
const skipPublish = process.argv.includes('--no-publish');
const forceFresh = process.argv.includes('--fresh');
const variant = isDebug ? 'debug' : 'release';
const gradleTask = isDebug ? 'assembleDebug' : 'assembleRelease';
const gradlew = gradlewName();
const apkRel = isDebug
  ? 'app/build/outputs/apk/debug/app-debug.apk'
  : 'app/build/outputs/apk/release/app-release.apk';

function run(command, cwd = root) {
  console.log(`\n> ${command}\n`);
  execSync(command, { cwd, stdio: 'inherit', env: process.env });
}

function ensureAndroidSdk() {
  if (process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT) return;

  const defaultSdk =
    process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
      : path.join(process.env.HOME || '', 'Library', 'Android', 'sdk');

  if (fs.existsSync(defaultSdk)) {
    process.env.ANDROID_HOME = defaultSdk;
    process.env.ANDROID_SDK_ROOT = defaultSdk;
    console.log(`Using ANDROID_HOME=${defaultSdk}`);
  } else {
    console.error(
      'ANDROID_HOME is not set. Install Android SDK or set ANDROID_HOME.',
    );
    process.exit(1);
  }
}

function ensureGradleHome() {
  const gradleHome =
    process.platform === 'win32'
      ? 'C:\\gradle'
      : path.join(process.env.HOME || '', '.gradle-local');

  fs.mkdirSync(gradleHome, { recursive: true });
  process.env.GRADLE_USER_HOME = gradleHome;
  console.log(`Using GRADLE_USER_HOME=${gradleHome}`);
}

function patchGradleProperties() {
  const propsPath = path.join(androidDir, 'gradle.properties');
  if (!fs.existsSync(propsPath)) return;

  let content = fs.readFileSync(propsPath, 'utf8');
  const patches = {
    'android.enableLongPaths': 'true',
    reactNativeArchitectures: 'arm64-v8a',
    newArchEnabled: 'false',
  };

  for (const [key, value] of Object.entries(patches)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}\n`;
    }
  }

  fs.writeFileSync(propsPath, content);
  console.log('Patched android/gradle.properties for Windows local builds');
}

function copyReleaseApk(apkPath, version, versionCode) {
  fs.mkdirSync(releasesDir, { recursive: true });
  const suffix = isDebug ? 'debug' : 'release';
  const fileName = `shakes-pear-v${version}-${suffix}.apk`;
  const destPath = path.join(releasesDir, fileName);
  fs.copyFileSync(apkPath, destPath);

  const { size } = fs.statSync(destPath);
  const sizeMb = (size / (1024 * 1024)).toFixed(1);
  const builtAt = new Date().toISOString();

  const manifest = addRelease({
    version,
    versionCode,
    variant: suffix,
    fileName,
    builtAt,
    sizeMb,
  });
  updateReadme(manifest);

  return { destPath, fileName, sizeMb };
}

ensureAndroidSdk();
ensureGradleHome();

let versionInfo = readVersions();
if (!isDebug && !skipBump) {
  versionInfo = bumpVersion();
  console.log(
    `\nVersion bumped → ${versionInfo.version} (versionCode ${versionInfo.versionCode})\n`,
  );
} else {
  console.log(
    `\nBuilding version ${versionInfo.version} (versionCode ${versionInfo.versionCode})\n`,
  );
}

console.log('Step 1/2 — prepare android project');
prepareAndroidProject(versionInfo, { fresh: forceFresh });

patchGradleProperties();

console.log(`Step 2/2 — Gradle ${gradleTask}`);
stopGradle();
run(`${gradlew} ${gradleTask}`, androidDir);

const apkPath = path.join(androidDir, apkRel);
if (!fs.existsSync(apkPath)) {
  console.error(`APK not found at ${apkPath}`);
  process.exit(1);
}

const { size } = fs.statSync(apkPath);
const mb = (size / (1024 * 1024)).toFixed(1);
console.log(`\n✓ ${variant} APK ready (${mb} MB):\n  ${apkPath}\n`);

if (!isDebug) {
  const published = copyReleaseApk(
    apkPath,
    versionInfo.version,
    versionInfo.versionCode,
  );
  console.log(`✓ Copied to releases/${published.fileName}`);
  console.log('✓ README APK table updated');

  if (!skipPublish) {
    run(`node scripts/publish-release.js ${versionInfo.version}`);
  } else {
    console.log('--no-publish — skipping git commit/push.');
  }
}
