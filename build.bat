@echo off
REM Build script for Windows

echo Building BNI ATM Dashboard...

REM Install dependencies if not already installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Build for Windows
echo Building for Windows...
call npm run build-win

echo Build complete! Check the dist/ folder for the executable.
