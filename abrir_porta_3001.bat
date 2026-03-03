@echo off
echo Abrindo porta 3001 para o backend Contrata AI...
netsh advfirewall firewall add rule name="Contrata AI Backend Port 3001" dir=in action=allow protocol=TCP localport=3001
echo.
echo Feito! A porta 3001 esta aberta.
pause
