#!/bin/bash
# Setup script for EyeZone development on Linux
# Installs Cordova, Android SDK, and Java

echo "🚀 EyeZone Development Setup (Ubuntu/Debian)"
echo ""

# Update package manager
echo "Updating package manager..."
sudo apt-get update

# Install Java
echo "Installing Java JDK..."
sudo apt-get install -y openjdk-17-jdk openjdk-17-jdk-headless

# Install Android SDK prerequisites
echo "Installing Android SDK prerequisites..."
sudo apt-get install -y wget unzip

# Download Android SDK
echo "Installing Android SDK command-line tools..."
mkdir -p $HOME/Android/Sdk
cd $HOME/Android/Sdk
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
unzip -q cmdline-tools.zip
rm cmdline-tools.zip

# Install Cordova
echo "Installing Cordova..."
npm install -g cordova

# Set environment variables
echo ""
echo "Setting up environment variables..."
echo 'export ANDROID_HOME="$HOME/Android/Sdk"' >> ~/.bashrc
echo 'export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.bashrc
echo 'export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"' >> ~/.bashrc

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Reload your shell: source ~/.bashrc"
echo "2. Clone EyeZone: git clone https://github.com/Sivadarshini31/EyeZone.git"
echo "3. cd EyeZone && npm install"
echo "4. ./build-apk.sh"
