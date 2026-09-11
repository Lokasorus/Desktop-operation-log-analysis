@echo off
echo ================================================================================
echo   Installing Dependencies for Document Processing Demo
echo ================================================================================
echo.
echo Installing Flask, Anthropic, and other required packages...
echo.

"C:\Users\aryan\AppData\Local\Programs\Python\Python312\python.exe" -m pip install flask anthropic python-dotenv

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo   SUCCESS! All dependencies installed.
    echo ================================================================================
    echo.
    echo You can now run the demo by:
    echo   1. Double-clicking "start_demo.bat"
    echo   2. Or running: python server.py
    echo.
    echo Then open: http://localhost:5000
    echo.
) else (
    echo.
    echo ================================================================================
    echo   ERROR: Installation failed!
    echo ================================================================================
    echo.
    echo Please check your internet connection and try again.
    echo.
)

pause
