#!/bin/bash
# Quick build script for EyeZone APK (debug build)
# Usage: ./build-apk.sh
# Output: cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk

set -e

echo "🔨 Building EyeZone APK..."

# Check prerequisites
if ! command -v cordova &> /dev/null; then
    echo "❌ Cordova not found. Install with: npm install -g cordova"
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME not set. Please set Android SDK path."
    exit 1
fi

if [ -z "$JAVA_HOME" ]; then
    echo "❌ JAVA_HOME not set. Please set Java path."
    exit 1
fi

echo "✓ Prerequisites OK"
echo "  ANDROID_HOME: $ANDROID_HOME"
echo "  JAVA_HOME: $JAVA_HOME"

# Build
echo ""
echo "📦 Building web assets..."
npm run package:web

echo "🔄 Preparing Cordova..."
npm run cordova:prepare

echo "🏗️  Building APK (this may take a few minutes)..."
cd "cd MyApp"
cordova build android --debug

APK_PATH="platforms/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK built successfully!"
    echo "📁 Location: $APK_PATH"
    echo "📊 Size: $SIZE"
    echo ""
    echo "📱 To install on device:"
    echo "   adb install $APK_PATH"
else
    echo "❌ APK build failed. Check logs above."
    exit 1
fi
