# EyeZone APK Build Options

You have 3 options to get your APK:

## Option 1: Docker Build (Recommended – Works on Any OS)

If you have Docker installed, run:

```bash
chmod +x build-apk-docker.sh
./build-apk-docker.sh
```

This will:
- Download Android SDK in a Docker container
- Build the APK automatically (takes 5-10 min first time)
- Output the APK to `cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

**Install on device:**
```bash
adb install "cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk"
```

---

## Option 2: Local Machine Build (Faster if Android SDK already installed)

Clone on your local machine and run:

```bash
git clone https://github.com/Sivadarshini31/EyeZone.git
cd EyeZone
npm install
./build-apk.sh
```

This assumes you already have:
- Android SDK
- Java JDK
- Node.js and npm

---

## Option 3: GitHub Actions Auto-Build (Upload APK URL)

Push a tag and GitHub Actions will build and release:

```bash
git tag -a v1.0.0 -m "Release"
git push origin v1.0.0
```

Then download from: https://github.com/Sivadarshini31/EyeZone/releases

**Note:** GitHub Actions build may fail due to SDK constraints. Docker or local build is more reliable.

---

## Troubleshooting

**Docker: "Cannot connect to Docker daemon"**
- Solution: Start Docker Desktop and try again

**Local build: "ANDROID_HOME not set"**
- Solution: Run `./setup-macos.sh` or `./setup-linux.sh` first

**adb: command not found**
- Solution: `adb` is part of Android SDK Platform Tools. Set up Android SDK first.

---

## Questions?

For detailed setup, see:
- `RELEASE_BUILD.md` – Complete manual build guide
- `setup-macos.sh` – macOS one-command setup
- `setup-linux.sh` – Linux one-command setup
