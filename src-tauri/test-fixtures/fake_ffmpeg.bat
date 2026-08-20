@echo off
rem Fake FFmpeg untuk keperluan test sidecar.rs di Windows.
rem Setara dengan fake_ffmpeg.sh: output path selalu argumen TERAKHIR,
rem tambahkan "--fail" di mana saja untuk mensimulasikan kegagalan.
setlocal enabledelayedexpansion

set "OUTPUT="
set "FAIL=0"

for %%a in (%*) do (
  if "%%a"=="--fail" set "FAIL=1"
  set "OUTPUT=%%a"
)

if "%FAIL%"=="1" (
  echo Error: Invalid data found when processing input 1>&2
  exit /b 1
)

for %%p in (1000000 5000000 10000000) do (
  echo frame=100 1>&2
  echo out_time_us=%%p 1>&2
  echo progress=continue 1>&2
  ping -n 1 -w 50 127.0.0.1 >nul
)

echo progress=end 1>&2
echo fake audio content > "%OUTPUT%"
exit /b 0
