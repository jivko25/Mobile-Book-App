#!/usr/bin/env node
/**
 * Windows-compatible local Android APK build.
 * EAS `build --local` requires macOS/Linux; this uses Gradle directly.
 *
 * Output: android/app/build/outputs/apk/release/app-release.apk
 * Debug:  android/app/build/outputs/apk/debug/app-debug.apk
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const androidDir = path.join(root, 'android');
const isDebug = process.argv.includes('--debug');
const variant = isDebug ? 'Debug' : 'Release';
const gradleTask = isDebug ? 'assembleDebug' : 'assembleRelease';
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
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

/** Short Gradle cache path — avoids Windows MAX_PATH (260) errors. */
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

ensureAndroidSdk();
ensureGradleHome();

console.log('Step 1/2 — expo prebuild (android)');
run('npx expo prebuild --platform android --no-install');

patchGradleProperties();

console.log(`Step 2/2 — Gradle ${gradleTask}`);
run(`${gradlew} --stop`, androidDir);
run(`${gradlew} ${gradleTask}`, androidDir);

const apkPath = path.join(androidDir, apkRel);
if (!fs.existsSync(apkPath)) {
  console.error(`APK not found at ${apkPath}`);
  process.exit(1);
}

const { size } = fs.statSync(apkPath);
const mb = (size / (1024 * 1024)).toFixed(1);
console.log(`\n✓ ${variant} APK ready (${mb} MB):\n  ${apkPath}\n`);
