const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const androidDir = path.join(root, 'android');

function sleep(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // Busy wait for Windows file handle release.
  }
}

function gradlewName() {
  return process.platform === 'win32' ? 'gradlew.bat' : 'gradlew';
}

function hasAndroidProject() {
  return fs.existsSync(path.join(androidDir, gradlewName()));
}

function killJavaProcesses() {
  if (process.platform !== 'win32') return;
  try {
    execSync('taskkill /F /IM java.exe /T', { stdio: 'ignore' });
    sleep(2000);
  } catch {
    // No Java/Gradle processes running.
  }
}

function stopGradle() {
  const gradlewPath = path.join(androidDir, gradlewName());
  if (!fs.existsSync(gradlewPath)) return;

  try {
    execSync(`${gradlewName()} --stop`, {
      cwd: androidDir,
      stdio: 'inherit',
      env: process.env,
    });
  } catch {
    // Daemon may not be running.
  }

  sleep(process.platform === 'win32' ? 1500 : 500);
}

function removeTree(dir) {
  killJavaProcesses();
  stopGradle();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    if (!fs.existsSync(dir)) return;

    try {
      if (process.platform === 'win32') {
        execSync(`cmd /c rmdir /s /q "${dir}"`, { stdio: 'ignore' });
      } else {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {
      // Retry after releasing handles.
    }

    sleep(1500);
  }

  if (fs.existsSync(dir)) {
    throw new Error(
      `Could not remove ${dir}. Close Android Studio, stop npm start, then retry with --fresh.`,
    );
  }
}

function syncAndroidVersion(version, versionCode) {
  const gradlePath = path.join(androidDir, 'app', 'build.gradle');
  if (!fs.existsSync(gradlePath)) return false;

  let content = fs.readFileSync(gradlePath, 'utf8');
  const versionCodeRe = /versionCode\s+\d+/;
  const versionNameRe = /versionName\s+"[^"]+"/;

  if (!versionCodeRe.test(content) || !versionNameRe.test(content)) {
    return false;
  }

  content = content.replace(versionCodeRe, `versionCode ${versionCode}`);
  content = content.replace(versionNameRe, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, content);
  console.log(`Synced android/app/build.gradle → ${version} (${versionCode})`);
  return true;
}

function runPrebuild({ fresh = false } = {}) {
  if (fresh && fs.existsSync(androidDir)) {
    console.log('Removing android/ for fresh prebuild…');
    removeTree(androidDir);
  } else if (fs.existsSync(androidDir) && !hasAndroidProject()) {
    console.log('android/ is incomplete — removing before prebuild…');
    removeTree(androidDir);
  }

  killJavaProcesses();
  stopGradle();

  const env = { ...process.env, CI: '1' };
  const hasProject = hasAndroidProject();
  const cmd = hasProject
    ? 'npx expo prebuild --platform android --no-install --no-clean'
    : 'npx expo prebuild --platform android --no-install';

  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit', env });
}

function prepareAndroidProject(versionInfo, { fresh = false } = {}) {
  if (fresh || !hasAndroidProject()) {
    runPrebuild({ fresh });
    return;
  }

  console.log('Reusing existing android/ — skipping expo prebuild');
  stopGradle();
  const synced = syncAndroidVersion(versionInfo.version, versionInfo.versionCode);
  if (!synced) {
    console.warn(
      'Could not sync version in build.gradle — run with --fresh if the build fails.',
    );
  }
}

module.exports = {
  androidDir,
  gradlewName,
  hasAndroidProject,
  killJavaProcesses,
  prepareAndroidProject,
  removeTree,
  stopGradle,
  syncAndroidVersion,
};
