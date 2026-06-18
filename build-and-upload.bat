@echo off
REM TradeAssist - build and upload to GitHub Release
REM Run this from the TradeAssist-desktop-app folder

echo === Building TradeAssist Desktop v1.0.1 ===
cd /d "%~dp0"
cd src-tauri

echo [1/3] Building release...
cargo build --release
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo [2/3] Build complete!
set "INSTALLER=%~dp0src-tauri\target\release\bundle\nsis\TradeAssist_1.0.0_x64-setup.exe"
set "PORTABLE=%~dp0src-tauri\target\release\tradeassist-app.exe"

if exist "%INSTALLER%" (
    echo Installer: %INSTALLER%
) else (
    echo WARNING: Installer not found at expected path
)

if exist "%PORTABLE%" (
    echo Portable: %PORTABLE%
) else (
    echo WARNING: Portable exe not found
)

echo.
echo [3/3] Upload to GitHub?
echo Go to: https://github.com/PorkJelly77/TradeAssist-desktop-app/releases/tag/v1.0.1
echo Drag and drop the .exe files there.
echo.
pause
