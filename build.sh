#!/bin/bash
# Build script for all platforms

echo "Building BNI ATM Dashboard for all platforms..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for Windows
echo "Building for Windows..."
npm run build-win

# Build for macOS (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    npm run build-mac
fi

# Build for Linux
echo "Building for Linux..."
npm run build-linux

echo "Build complete! Check the dist/ folder for the executables."
