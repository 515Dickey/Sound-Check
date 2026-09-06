# Sound Check

A small always-on-top Windows window that listens to the microphone and turns
GREEN / YELLOW / RED as the speaker gets louder. Built for Sean to keep on his
second monitor while gaming. (Formerly "Voice Meter"; settings and history from
that version are picked up automatically.)

## For Sean's PC

1. Make a folder such as `C:\SoundCheck` and copy these into it:
   `dist\SoundCheck.exe`, `startup\Add-SoundCheck-To-Startup.bat`, and
   `startup\Remove-SoundCheck-From-Startup.bat`. No install needed.
2. Double-click `SoundCheck.exe`. Windows may show a SmartScreen warning the
   first time because the exe is unsigned: click "More info" then "Run anyway".
3. If it says NO MIC: Windows Settings > Privacy & security > Microphone >
   turn on "Let desktop apps access your microphone".
4. Drag the window by its top bar onto the second monitor. It remembers its
   position and size next time.

## Start automatically when the PC restarts

Double-click `Add-SoundCheck-To-Startup.bat` once (it must sit in the same
folder as `SoundCheck.exe`). It puts a "Sound Check" shortcut in the Windows
Startup folder, so the app opens every time Sean signs in. To undo it,
double-click `Remove-SoundCheck-From-Startup.bat`.

If you would rather do it by hand, this PowerShell does the same thing (edit the
path on the first line):

```powershell
$exe = 'C:\SoundCheck\SoundCheck.exe'
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Sound Check.lnk'
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$s.TargetPath = $exe; $s.WorkingDirectory = Split-Path $exe; $s.IconLocation = "$exe,0"
$s.Save()
```

Notes: if the exe is ever moved, run the Add script again so the shortcut points
at the new location. The portable exe takes a few seconds to appear at sign-in
because it unpacks itself first. You can also see or disable it under Task
Manager > Startup apps.

## Using it

- GREEN = fine, YELLOW = getting loud, RED = too loud (flashes). Once yellow or
  red lights up it stays lit for the "Notifications stay lit for" time (default
  3 s) even if the voice drops right away, so a spike is still visible when he
  looks over. The bar shows the live level with white tick marks at the yellow
  and red thresholds. The counters under the bar are today's yellow and red
  episodes and reset at midnight.
- A short two-tone chime plays through the default output (his headset) each
  time it goes red. Toggle it or set its volume in settings.
- Chart icon opens Analytics: today's red / yellow counts, minutes monitored,
  reds per hour, a 7-day chart, today's reds vs. the prior-days average, and a
  list of today's moments with times. History lives on his PC only.
- Gear icon opens settings: pick the mic, drag the yellow/red sliders, set how
  long notifications stay lit, chime on/off and volume, or press "Auto-set from
  normal talking" and have Sean talk at an acceptable volume for 5 seconds.
- Pin icon toggles "stay on top of other windows" (on by default).

## Development

    npm install
    npm start          # run from source
    npm run build      # produces dist\SoundCheck.exe (portable, single file)

Files: `main.js` (Electron window, mic permission, remembers position, migrates
the old "Voice Meter" profile folder), `preload.js` (safe bridge for
close/minimize/pin), `index.html` (the meter UI, Web Audio level detection,
chime, analytics), `build/make-icon.js` (regenerates `build/icon.ico` and
`icon.png` with `node build/make-icon.js`), `startup/*.bat` (Startup-folder
shortcut scripts), `dev-serve.js` (static server for previewing the page in a
browser; not shipped).

Settings and history are stored in `%APPDATA%\Sound Check`. Levels are RMS in
dBFS with fast attack and slow release; defaults are yellow at -24 dB, red at
-12 dB. A loud episode is logged once, as yellow when it starts and upgraded to
red if it escalates.

Build note: electron-builder needs its winCodeSign tools to stamp the icon on
the exe. Its download fails on this PC (symlink privilege), so the extracted
folder was copied by hand to
`%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0`. If a
build ever complains about winCodeSign again, redo that copy or set
`signAndEditExecutable: false` under `build.win` (loses the custom exe icon).
