@echo off
setlocal EnableDelayedExpansion
REM Always run from the repo root, regardless of where the script is invoked
cd /d %~dp0
REM ============================================================
REM  LaunchGrid build runner — writes full logs to build-logs\
REM  so Claude can read them directly from the repo.
REM
REM  Usage:
REM    build.bat            -> web build (Next.js)
REM    build.bat web        -> web build
REM    build.bat mobile     -> mobile typecheck + expo config check
REM    build.bat ads        -> remotion ads typecheck
REM    build.bat vercel     -> latest Vercel deployment build logs
REM    build.bat push       -> clear stale git locks, commit all, push
REM    build.bat all        -> web + mobile + ads
REM ============================================================

set MODE=%1
if "%MODE%"=="" set MODE=web
if not exist build-logs mkdir build-logs

if "%MODE%"=="web"    goto :web
if "%MODE%"=="mobile" goto :mobile
if "%MODE%"=="ads"    goto :ads
if "%MODE%"=="apk"    goto :apk
if "%MODE%"=="vercel" goto :vercel
if "%MODE%"=="push"   goto :push
if "%MODE%"=="all"    goto :all
echo Unknown mode: %MODE%
exit /b 1

:apk
echo [build.bat] Android debug APK -^> build-logs\apk-build.log
pushd launchgrid-mobile\android
call gradlew.bat --stop > ..\..\build-logs\apk-build.log 2>&1
call gradlew.bat app:assembleDebug -x lint -x test >> ..\..\build-logs\apk-build.log 2>&1
set EXITCODE=!ERRORLEVEL!
popd
echo [build.bat] exit code: !EXITCODE! >> build-logs\apk-build.log
powershell -NoProfile -Command "Get-Content build-logs\apk-build.log -Tail 20"
if !EXITCODE!==0 (
  echo.
  echo [build.bat] SUCCESS — APK at:
  echo   launchgrid-mobile\android\app\build\outputs\apk\debug\app-debug.apk
) else (
  echo [build.bat] FAILED — full log: build-logs\apk-build.log
)
exit /b !EXITCODE!

:web
echo [build.bat] Web build -^> build-logs\web-build.log
call npm run build > build-logs\web-build.log 2>&1
set EXITCODE=!ERRORLEVEL!
echo. >> build-logs\web-build.log
echo [build.bat] exit code: !EXITCODE! >> build-logs\web-build.log
echo --- last 25 lines ---
powershell -NoProfile -Command "Get-Content build-logs\web-build.log -Tail 25"
echo [build.bat] Full log: build-logs\web-build.log (exit !EXITCODE!)
exit /b !EXITCODE!

:mobile
echo [build.bat] Mobile checks -^> build-logs\mobile-build.log
pushd launchgrid-mobile
(call npx tsc --noEmit 2>&1 & echo --- expo config --- & call npx expo config --type public 2>&1 1>nul && echo expo config OK) > ..\build-logs\mobile-build.log 2>&1
set EXITCODE=!ERRORLEVEL!
popd
echo [build.bat] exit code: !EXITCODE! >> build-logs\mobile-build.log
powershell -NoProfile -Command "Get-Content build-logs\mobile-build.log -Tail 25"
echo [build.bat] Full log: build-logs\mobile-build.log (exit !EXITCODE!)
exit /b !EXITCODE!

:ads
echo [build.bat] Ads typecheck -^> build-logs\ads-build.log
pushd launchgrid-ads
call npx tsc --noEmit > ..\build-logs\ads-build.log 2>&1
set EXITCODE=!ERRORLEVEL!
popd
echo [build.bat] exit code: !EXITCODE! >> build-logs\ads-build.log
powershell -NoProfile -Command "Get-Content build-logs\ads-build.log -Tail 25"
echo [build.bat] Full log: build-logs\ads-build.log (exit !EXITCODE!)
exit /b !EXITCODE!

:vercel
echo [build.bat] Vercel logs -^> build-logs\vercel.log
REM Needs one-time: npm i -g vercel && vercel login && vercel link
(echo === vercel ls === & call vercel ls 2>&1 & echo. & echo === latest deployment build logs === & for /f "skip=1 tokens=2" %%u in ('vercel ls 2^>nul') do (call vercel inspect %%u --logs 2>&1 & goto :vdone)) > build-logs\vercel.log 2>&1
:vdone
powershell -NoProfile -Command "Get-Content build-logs\vercel.log -Tail 30"
echo [build.bat] Full log: build-logs\vercel.log
exit /b 0

:push
echo [build.bat] Git commit + push -^> build-logs\git-push.log
(
  echo === clearing stale locks ===
  if exist .git\index.lock del /f .git\index.lock && echo deleted index.lock
  if exist .git\HEAD.lock  del /f .git\HEAD.lock  && echo deleted HEAD.lock
  if exist .git\refs\heads\main.lock del /f .git\refs\heads\main.lock && echo deleted main.lock
  echo === status ===
  git status --short
  echo === commit ===
  git add -A
  git commit -m "chore: sync working changes"
  echo === push ===
  git push origin main
) > build-logs\git-push.log 2>&1
powershell -NoProfile -Command "Get-Content build-logs\git-push.log -Tail 25"
echo [build.bat] Full log: build-logs\git-push.log
exit /b 0

:all
call %~f0 web
call %~f0 ads
call %~f0 mobile
exit /b 0
