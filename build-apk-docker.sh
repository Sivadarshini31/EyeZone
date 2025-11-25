#!/bin/bash
# Docker-based APK build (no local Android SDK needed)
# Usage: ./build-apk-docker.sh
# Output: cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk

set -e

echo "🐳 Building EyeZone APK with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker and try again."
    exit 1
fi

echo "✓ Docker is ready"
echo ""
echo "🏗️  Building APK in Docker container (this may take 5-10 minutes on first run)..."
echo ""

# Use official node:20 image with Android SDK
docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  -e ANDROID_HOME=/opt/android-sdk \
  -e JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
  ubuntu:24.04 \
  bash -c '
    set -e
    
    # Install dependencies
    apt-get update -qq
    apt-get install -y -qq \
      openjdk-17-jdk \
      nodejs npm \
      wget unzip \
      git \
      curl \
      gradle \
      > /dev/null 2>&1
    
    # Install Android SDK
    mkdir -p /opt/android-sdk
    cd /opt/android-sdk
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
    unzip -q commandlinetools-linux-11076708_latest.zip
    rm commandlinetools-linux-11076708_latest.zip
    export ANDROID_HOME=/opt/android-sdk
    export PATH="$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
    
    # Accept licenses
    yes | cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_HOME --licenses > /dev/null 2>&1
    
    # Install required Android packages
    cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_HOME \
      "platform-tools" \
      "platforms;android-34" \
      "build-tools;34.0.0" \
      > /dev/null 2>&1
    
    # Install Node/Cordova
    npm install -g cordova -q
    
    # Build in workspace
    cd /workspace
    npm install -q
    npm run package:web
    npm run cordova:prepare
    
    cd "/workspace/cd MyApp"
    cordova build android --debug --release
    echo "✅ APK built successfully!"
  '

APK_PATH="cd MyApp/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk"
DEBUG_APK="cd MyApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK built successfully!"
    echo "📁 Location: $APK_PATH"
    echo "📊 Size: $SIZE"
elif [ -f "$DEBUG_APK" ]; then
    SIZE=$(du -h "$DEBUG_APK" | cut -f1)
    echo ""
    echo "✅ Debug APK built successfully!"
    echo "📁 Location: $DEBUG_APK"
    echo "📊 Size: $SIZE"
else
    echo "❌ APK build failed."
    exit 1
fi

echo ""
echo "📱 To install on device:"
echo "   adb install $APK_PATH"
