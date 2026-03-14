@echo off
REM Capital Market Event - Local Setup Script
REM Run this to set up your local AI automation environment

echo ========================================
echo Capital Market Event - Setup
echo ========================================
echo.

echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from python.org
    pause
    exit /b 1
)
echo ✅ Python found

echo.
echo [2/5] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [3/5] Checking GitHub CLI...
gh --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: GitHub CLI not found
    echo Install from: https://cli.github.com
    echo You can still use the design agent but auto-commit won't work
) else (
    echo ✅ GitHub CLI found
    
    echo.
    echo [4/5] Checking GitHub authentication...
    gh auth status >nul 2>&1
    if errorlevel 1 (
        echo WARNING: Not logged into GitHub
        echo Run: gh auth login
    ) else (
        echo ✅ GitHub authenticated
    )
)

echo.
echo [5/5] Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo WARNING: Ollama not running
    echo Install from: https://ollama.ai
    echo Start with: ollama serve
    echo Then pull a model: ollama pull llama3.2
) else (
    echo ✅ Ollama is running
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Point your Porkbun domain to GitHub Pages:
echo    - Set up A records pointing to:
echo      185.199.108.153
echo      185.199.109.153
echo      185.199.110.153
echo      185.199.111.153
echo    - Or use CNAME for www to: sb4ssman.github.io
echo.
echo 2. Enable GitHub Pages in your repo settings
echo.
echo 3. Run the design agent:
echo    python design_agent.py --generate
echo.
echo 4. Set up scheduled runs with Windows Task Scheduler
echo.
echo ========================================
pause
