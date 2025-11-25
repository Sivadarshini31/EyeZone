<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EyeZone – Low Vision Assistant

An AI-powered mobile application that helps people with low vision through image description, text extraction, and voice interaction.

## 🚀 Get the APK (Local Build – Recommended)

**Build the APK on your machine in 3 steps:**

### Step 1: Clone the repo
```bash
git clone https://github.com/Sivadarshini31/EyeZone.git
cd EyeZone
npm install
```

### Step 2: Set up Android environment
Ensure you have Android SDK and Java installed. Set these environment variables:

**Linux/macOS:**
```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"  # macOS
export ANDROID_HOME="$HOME/Android/Sdk"           # Linux
export JAVA_HOME=$(/usr/libexec/java_home)        # macOS
export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
```

**Windows (Command Prompt):**
```cmd
set ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\sdk
set JAVA_HOME=C:\Program Files\Java\jdk-22
set PATH=%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\platform-tools;%PATH%
```

### Step 3: Build and get your APK
```bash
npm run package
npm run cordova:build:debug
```

Your APK is ready at:
```
cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

**Install on your device:**
```bash
adb install cd\ MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### GitHub Auto-Release (Advanced)

Alternatively, if you want GitHub Actions to auto-build:
1. Push a tag: `git tag -a v1.0.0 -m "Release" && git push origin v1.0.0`
2. Download from: https://github.com/Sivadarshini31/EyeZone/releases

---

## Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1w_FdalplUpuMt0eTqiI62vSVXdv22X5y

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (or use Claude via `window.CLAUDE_ENABLED`)
3. Run the app:
   `npm run dev`

## Build Scripts

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run server` — Start Claude proxy server
- `npm run package` — Build web and prepare Cordova
- `npm run cordova:build:debug` — Build unsigned APK for testing
- `npm run cordova:build:release` — Build signed release APK (requires keystore)

See [RELEASE_BUILD.md](./RELEASE_BUILD.md) for detailed release instructions.