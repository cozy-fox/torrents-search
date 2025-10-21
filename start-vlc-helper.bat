@echo off
echo VLC Helper Service for Jackett
echo =============================
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Checking peerflix installation...
peerflix --version
if %errorlevel% neq 0 (
    echo WARNING: peerflix command not found in PATH
    echo This is common with Node Version Manager (nvm4w)
    echo.
    echo Trying to find peerflix in npm global modules...
    
    for /f "tokens=*" %%i in ('npm root -g') do set NPM_ROOT=%%i
    echo NPM global root: %NPM_ROOT%
    
    if exist "%NPM_ROOT%\peerflix\app.js" (
        echo Found peerflix at: %NPM_ROOT%\peerflix\app.js
        echo.
        echo Starting VLC Helper with alternative peerflix method...
        set MODE=peerflix
        set PEERFLIX_PATH=%NPM_ROOT%\peerflix\app.js
        node vlc-helper.js
    ) else (
        echo ERROR: peerflix not found in npm global modules
        echo Please install peerflix: npm install -g peerflix
        pause
        exit /b 1
    )
) else (
    echo peerflix found in PATH
    echo.
    echo Starting VLC Helper service...
    node vlc-helper.js
)

pause
