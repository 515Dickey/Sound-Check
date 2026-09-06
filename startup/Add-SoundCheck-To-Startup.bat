@echo off
:: Creates a shortcut to SoundCheck.exe in the current user's Startup folder so it
:: launches every time Windows starts. Put this .bat in the same folder as SoundCheck.exe
:: and double-click it once.
set "EXE=%~dp0SoundCheck.exe"
if not exist "%EXE%" (
  echo Could not find SoundCheck.exe next to this script.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$exe = '%EXE%';" ^
  "$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Sound Check.lnk';" ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk);" ^
  "$s.TargetPath = $exe; $s.WorkingDirectory = Split-Path $exe; $s.IconLocation = \"$exe,0\"; $s.Description = 'Sound Check volume monitor';" ^
  "$s.Save(); Write-Host ('Sound Check will start with Windows. Shortcut: ' + $lnk)"
pause
