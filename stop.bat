@echo off
echo.
echo Stopping PlatifyX...
echo.

if not exist .platifyx.pid (
    echo Warning: PlatifyX is not running
    exit /b 1
)

echo Stopping Backend...
taskkill /F /IM go.exe > nul 2>&1

echo Stopping Frontend...
taskkill /F /IM node.exe > nul 2>&1

del .platifyx.pid > nul 2>&1

echo.
echo PlatifyX stopped successfully!
echo.
