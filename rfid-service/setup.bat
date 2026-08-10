@echo off
:: =======================================================================
:: Haemovigil RFID Bridge Service Auto-Installer (Smart Edition)
:: Installs Drivers, downloads Node (if missing), copies app to a permanent
:: location, configures PM2 startup & auto-recovery.
:: =======================================================================

set "APP_NAME=haemovigil-rfid-bridge"
:: Permanent install location - survives deletion of the Downloads/zip folder
set "INSTALL_DIR=%ProgramData%\Haemovigil\rfid-bridge"

echo ==========================================================
echo   Haemovigil RFID Service Installer (Smart Edition)
echo ==========================================================
echo.

:: Check for administrative rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Administrative privileges confirmed.
) else (
    echo [INFO] Administrative privileges required. Requesting UAC elevation...
    goto UACPrompt
)

goto :Main

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:Main
    :: Navigate to script directory (this is the temp/Downloads copy)
    set "SOURCE_DIR=%~dp0"
    cd /d "%SOURCE_DIR%"

    :: 1. Check if Node.js is installed, auto-download if missing
    echo [1/6] Verifying Node.js environment...
    node -v >nul 2>&1
    if %errorLevel% neq 0 (
        echo [WARN] Node.js is NOT installed on this machine!
        echo [INFO] Downloading Node.js v20 LTS installer silently using PowerShell...

        powershell -Command "Write-Host 'Downloading installer...'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile '%temp%\node_setup.msi'"

        if not exist "%temp%\node_setup.msi" (
            echo [ERROR] Failed to download Node.js. Please install it manually from https://nodejs.org/
            pause
            exit /B
        )

        echo [INFO] Installing Node.js silently. Please wait...
        start /wait msiexec /i "%temp%\node_setup.msi" /qn /norestart
        del "%temp%\node_setup.msi"

        echo [INFO] Refreshing system path...
        for /f "tokens=2*" %%A in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path') do set "Path=%%B"

        node -v >nul 2>&1
        if %errorLevel% neq 0 (
            echo [OK] Node.js installed successfully.
            echo Please RESTART this setup.bat script ^(close and open again^) to refresh the environment paths.
            pause
            exit
        )
    )
    echo [OK] Node.js is installed.

    :: 2. Copy app to a permanent, stable install location
    echo.
    echo [2/6] Installing application files to permanent location...
    echo         %INSTALL_DIR%
    if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

    :: robocopy: mirror source into INSTALL_DIR, skip node_modules/.git (reinstalled fresh)
    robocopy "%SOURCE_DIR%." "%INSTALL_DIR%" /E /XD node_modules .git /XF setup.bat >nul
    :: robocopy exit codes 0-7 are all "success" variants; 8+ means real failure
    if %errorLevel% geq 8 (
        echo [ERROR] Failed to copy application files to %INSTALL_DIR%
        pause
        exit /B
    )
    echo [OK] Application files installed.

    :: From here on, operate ONLY out of the permanent install dir.
    :: The original Downloads/zip folder is no longer needed by the service.
    cd /d "%INSTALL_DIR%"

    :: 3. Find and Install Smart Card Reader Drivers (from the copied driver folder)
    echo.
    echo [3/6] Checking driver folder...

    set "DRIVER_PATH="
    for /r "%INSTALL_DIR%\driver" %%f in (Setup.exe) do (
        if exist "%%f" (
            set "DRIVER_PATH=%%f"
        )
    )

    if defined DRIVER_PATH (
        echo [INFO] Found driver installer: "%DRIVER_PATH%"
        echo [INFO] Installing drivers silently...
        start /wait "" "%DRIVER_PATH%" /s /v/qn
        echo [OK] Driver installation completed.
    ) else (
        echo [WARN] Could not find 'Setup.exe' inside 'driver\' directory.
        echo Skipping driver installation. Ensure your ACR1281U-C1 drivers are installed manually.
    )

    :: 4. Install local Node.js dependencies (in the permanent location)
    echo.
    echo [4/6] Installing package dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo [ERROR] npm install failed. Check your internet connection.
        pause
        exit /B
    )
    echo [OK] Dependencies installed.

    :: 5. Install PM2 and Windows startup wrappers globally
    echo.
    echo [5/6] Installing PM2 background process manager globally...
    call npm install pm2 -g
    call npm install pm2-windows-startup -g
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install PM2 global components.
        pause
        exit /B
    )
    echo [OK] PM2 installed successfully.

    echo.
    echo Registering PM2 as a Windows boot service...
    call pm2-startup install
    echo [OK] PM2 Startup configuration completed.

    echo.
    echo Configuring service auto-recovery rules (restart on crash)...
    sc failure pm2 reset= 86400 actions= restart/5000/restart/5000/restart/5000 >nul 2>&1
    sc failure PM2 reset= 86400 actions= restart/5000/restart/5000/restart/5000 >nul 2>&1
    echo [OK] Service recovery configured to auto-restart within 5 seconds of failure.

    :: 6. Register rfid-service with PM2, pointing at the PERMANENT location
    echo.
    echo [6/6] Registering RFID Bridge with PM2 daemon...
    :: Remove any stale registration pointing at an old/deleted path first
    call pm2 delete "%APP_NAME%" >nul 2>&1
    call pm2 start "%INSTALL_DIR%\index.js" --name "%APP_NAME%" --cwd "%INSTALL_DIR%"
    call pm2 save
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to register process with PM2.
        pause
        exit /B
    )

    :: Drop a matching uninstaller into the install dir for clean removal later
    call :WriteUninstaller

    echo.
    echo ==========================================================
    echo   INSTALLATION COMPLETED SUCCESSFULLY!
    echo ==========================================================
    echo.
    echo [SUMMARY]
    echo  - App installed to: %INSTALL_DIR%
    echo  - You can now delete the folder you downloaded/extracted this from.
    echo  - The service '%APP_NAME%' is now running from the permanent location.
    echo  - PM2 Auto-Recovery is configured to restart the daemon if it fails.
    echo  - It will automatically launch in the background on boot.
    echo.
    echo Check service status any time with:  pm2 status
    echo To fully remove the service, run:    %INSTALL_DIR%\uninstall.bat
    echo.
    pause
    exit

:WriteUninstaller
    (
        echo @echo off
        echo echo Removing %APP_NAME% ...
        echo call pm2 delete "%APP_NAME%"
        echo call pm2 save
        echo cd /d "%%~dp0\.."
        echo rmdir /s /q "%INSTALL_DIR%"
        echo echo Done.
        echo pause
    ) > "%INSTALL_DIR%\uninstall.bat"
    exit /B