@echo off
echo =======================================================
echo     Abriendo el puerto 3000 en el Firewall de Windows
echo =======================================================
echo.
echo Por favor asegurate de haber ejecutado esto como "Administrador".
echo.

netsh advfirewall firewall add rule name="Tokaverse API (Port 3000)" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Tokaverse API (Port 3000)" dir=out action=allow protocol=TCP localport=3000

echo.
echo Listo! El puerto 3000 ya es publico en tu red local (LAN).
echo Presiona cualquier tecla para cerrar esto...
pause >nul
