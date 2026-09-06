@echo off
:: Removes the Startup-folder shortcut created by Add-SoundCheck-To-Startup.bat.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Sound Check.lnk';" ^
  "if (Test-Path $lnk) { Remove-Item $lnk; Write-Host 'Removed. Sound Check will no longer start with Windows.' } else { Write-Host 'No startup shortcut found.' }"
pause
