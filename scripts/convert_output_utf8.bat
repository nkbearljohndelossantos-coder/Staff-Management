@echo off
setlocal
echo Converting vps_inspection_output.txt from UTF-16 to UTF-8...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\vps_inspection_output.txt'; $c=[System.IO.File]::ReadAllText($p, [System.Text.Encoding]::Unicode); [System.IO.File]::WriteAllText($p, $c, [System.Text.Encoding]::UTF8); Write-Host 'Conversion to UTF-8 successful!' -ForegroundColor Green"
echo Done.
pause
