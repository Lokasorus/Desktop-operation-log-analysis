@echo off
echo ================================================================================
echo   Document Processing Automation - Web Demo
echo ================================================================================
echo.
echo Starting server...
echo.

REM Use the installed Python directly
"C:\Users\aryan\AppData\Local\Programs\Python\Python312\python.exe" server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start server!
    echo.
    echo Make sure you installed the dependencies first:
    echo   "C:\Users\aryan\AppData\Local\Programs\Python\Python312\python.exe" -m pip install flask anthropic python-dotenv
    echo.
    pause
    exit /b 1
)
