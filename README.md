<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EyeZone – Low Vision Assistant

An AI-powered mobile application that helps people with low vision through image description, text extraction, and voice interaction.

## 🚀 Get the APK (Easiest Way)

**To build and auto-release an APK:**

1. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Ready for release"
   ```

2. Push a version tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. **Download your APK:**
   - Go to: https://github.com/Sivadarshini31/EyeZone/releases
   - Find your tag (e.g., `v1.0.0`)
   - Download `EyeZone-v1.0.0.apk`
   - Install on any Android device

GitHub Actions will automatically build the APK and attach it to your release. No additional setup needed!

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