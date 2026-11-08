@echo off
setlocal
cd /d "%~dp0"

set "PORTAL=%~dp0index.html"
if not exist "%PORTAL%" (
  echo Could not find index.html in this folder.
  echo Keep this launcher next to index.html.
  pause
  exit /b 1
)

rem Prefer a known desktop browser so the portal opens even when the
rem default browser association is broken or points at a dead preview URL.
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if /I "%~1"=="--check" (
  echo PORTAL="%PORTAL%"
  if defined BROWSER (echo BROWSER="%BROWSER%") else (echo BROWSER=default)
  exit /b 0
)

if defined BROWSER (
  start "" "%BROWSER%" "%PORTAL%"
) else (
  start "" "%PORTAL%"
)

exit /b 0
