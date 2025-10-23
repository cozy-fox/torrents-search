@echo off
REM Jackett Docker Deployment Script for Windows
REM This script will build and run the Jackett project using Docker

echo 🚀 Starting Jackett Docker Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/install/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo [INFO] Docker and Docker Compose are installed ✓

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "config" mkdir config
if not exist "downloads" mkdir downloads
echo [SUCCESS] Directories created ✓

REM Stop existing containers if running
echo [INFO] Stopping any existing Jackett containers...
docker-compose down >nul 2>&1
echo [SUCCESS] Existing containers stopped ✓

REM Build the Docker image
echo [INFO] Building Jackett Docker image...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker image
    pause
    exit /b 1
)
echo [SUCCESS] Docker image built successfully ✓

REM Start the services
echo [INFO] Starting Jackett services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Jackett services
    pause
    exit /b 1
)
echo [SUCCESS] Jackett services started ✓

REM Wait for the service to be ready
echo [INFO] Waiting for Jackett to be ready...
timeout /t 10 /nobreak >nul

REM Check if the service is running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] 🎉 Jackett is now running!
    echo.
    echo 📋 Access Information:
    echo    🌐 Web Interface: http://localhost:9117
    echo    📁 Config Directory: .\config
    echo    📁 Downloads Directory: .\downloads
    echo.
    echo 🔧 Management Commands:
    echo    Stop:    docker-compose down
    echo    Restart: docker-compose restart
    echo    Logs:    docker-compose logs -f
    echo    Status:  docker-compose ps
    echo.
    echo [SUCCESS] Deployment completed successfully! 🚀
    echo.
    echo Press any key to open Jackett in your browser...
    pause >nul
    start http://localhost:9117
) else (
    echo [ERROR] Failed to start Jackett. Check the logs with: docker-compose logs
    pause
    exit /b 1
)
