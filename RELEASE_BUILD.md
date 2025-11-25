# EyeZone Release APK Build Guide

This guide explains how to generate a release-signed APK for publishing to the Google Play Store.

## Prerequisites

- **Android SDK** installed and configured (API level 30+)
- **Java Development Kit (JDK)** 11 or later
- **Cordova CLI** installed globally: `npm install -g cordova`
- **Node.js** and npm (for this project)

## Step 1: Set up Android SDK Environment

Set these environment variables on your build machine:

```bash
export ANDROID_HOME="/path/to/android-sdk"
export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="/path/to/jdk"
```

Example for Linux/macOS:
```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"  # macOS
export ANDROID_HOME="$HOME/Android/Sdk"           # Linux
export JAVA_HOME=$(/usr/libexec/java_home)        # macOS
```

Example for Windows (Command Prompt):
```cmd
set ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\sdk
set JAVA_HOME=C:\Program Files\Java\jdk-22
set PATH=%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\platform-tools;%PATH%
```

Verify your setup:
```bash
android --version
cordova requirements android
```

## Step 2: Generate a Signing Keystore (first time only)

A keystore is a file that holds your private signing key. Generate one:

```bash
keytool -genkey -v -keystore eyezone-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias eyezone-release-key
```

This will prompt you for:
- Keystore password (save this securely)
- Key alias password (same as keystore password is fine)
- Full name, Organization, etc. (can be anything; you decide)

**Important:** Store `eyezone-release-key.keystore` securely. You'll need it for all future releases.

## Step 3: Create a Build Configuration

In the `cd MyApp/` directory, create a file named `build.json`:

```json
{
  "android": {
    "release": {
      "keystore": "../eyezone-release-key.keystore",
      "storePassword": "your-keystore-password",
      "alias": "eyezone-release-key",
      "password": "your-key-password",
      "keystoreType": "jks"
    }
  }
}
```

**Security Warning:** Do NOT commit `build.json` or the `.keystore` file to git. Add them to `.gitignore`:
```bash
echo "build.json" >> cd\ MyApp/.gitignore
echo "*.keystore" >> cd\ MyApp/.gitignore
```

Alternatively, use environment variables:
```bash
export CORDOVA_ANDROID_KEYSTORE_PATH="../eyezone-release-key.keystore"
export CORDOVA_ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export CORDOVA_ANDROID_KEY_ALIAS="eyezone-release-key"
export CORDOVA_ANDROID_KEY_PASSWORD="your-key-password"
```

## Step 4: Build the Release APK

From the project root:

```bash
npm run cordova:build:release
```

Or manually:
```bash
cd "cd MyApp" && cordova build android --release
```

The signed APK will be generated at:
```
cd MyApp/platforms/android/app/build/outputs/apk/release/app-release.apk
```

## Step 5: Verify the APK (Optional)

Check that the APK is signed:
```bash
jarsigner -verify -verbose cd\ MyApp/platforms/android/app/build/outputs/apk/release/app-release.apk
```

Or use zipalign to optimize:
```bash
zipalign -v 4 cd\ MyApp/platforms/android/app/build/outputs/apk/release/app-release.apk \
  cd\ MyApp/platforms/android/app/build/outputs/apk/release/app-release-aligned.apk
```

## Step 6: Upload to Google Play Store

1. Create a Google Play Developer account (requires $25 registration fee).
2. Create a new app in the Google Play Console.
3. Upload the signed APK under **Release > Production**.
4. Fill in app details, screenshots, privacy policy, etc.
5. Submit for review (typically takes a few hours to 24 hours).

## Debug Build (Unsigned)

To build an unsigned APK for testing:

```bash
npm run cordova:build:debug
```

Debug APK output:
```
cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Install on an emulator or connected device:
```bash
adb install cd\ MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

- **ANDROID_HOME not found:** Set the environment variable before running the build.
- **keystore password incorrect:** Ensure the password matches what you set in `build.json` or environment variables.
- **Java version mismatch:** Ensure JAVA_HOME points to JDK 11+.
- **Build fails with "Failed to find 'android' command":** Update your PATH to include `$ANDROID_HOME/tools/bin` and `$ANDROID_HOME/platform-tools`.

For more details on Cordova builds, see: https://cordova.apache.org/docs/en/12.x/guide/platforms/android/

## App Metadata

Update `cd MyApp/config.xml` to customize:
- App name, version, description
- Icons and splash screens
- Permissions and plugin configurations

Current config:
- **App ID:** `com.eyezone.lowvision`
- **Name:** EyeZone
- **Version:** 1.0.0
- **Author:** EyeZone Team

