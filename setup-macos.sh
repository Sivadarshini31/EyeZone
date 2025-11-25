#!/bin/bash
# Setup script for EyeZone development on macOS
# Installs Cordova, Android SDK, and Java

echo "🚀 EyeZone Development Setup (macOS)"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Java
echo "Installing Java..."
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17/Contents/Home"' >> ~/.zshrc

# Install Android SDK (via Android Studio or command-line tools)
echo "Installing Android SDK command-line tools..."
brew install android-sdk
echo 'export ANDROID_HOME="/opt/homebrew/share/android-sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.zshrc

# Install Cordova
echo "Installing Cordova..."
npm install -g cordova

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node@20
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Reload your shell: source ~/.zshrc"
echo "2. Clone EyeZone: git clone https://github.com/Sivadarshini31/EyeZone.git"
echo "3. cd EyeZone && npm install"
echo "4. ./build-apk.sh"
