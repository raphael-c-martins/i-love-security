@echo off
chcp 65001 > nul
title I Love Security - Console de Operacoes
color 0B

cd /d "%~dp0"

:: Garantir que a pasta de logs exista
if not exist "logs\logs-cmd" mkdir "logs\logs-cmd"

:: Captura o IP local de forma simples (tentativa com python e fallback ipconfig)
for /f "delims=" %%i in ('python -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2^>nul') do set IP_LOCAL=%%i
if "%IP_LOCAL%"=="" (
    for /f "tokens=14" %%i in ('ipconfig ^| findstr IPv4') do set IP_LOCAL=%%i
)

:: Gerar nome do arquivo de log com base na data para auditoria diaria
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set LOG_DATE=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%
set LOG_TIME=%dt:~8,2%:%dt:~10,2%:%dt:~12,2%
set LOG_FILE=logs\logs-cmd\auditoria_%LOG_DATE%.log

echo. >> "%LOG_FILE%"
echo ================================================== >> "%LOG_FILE%"
echo I LOVE SECURITY - NOVA SESSAO INICIADA AS %LOG_TIME% >> "%LOG_FILE%"
echo ================================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

:: Ler a ultima porta salva ou definir padrao
set PORTA=8001
if exist "logs\logs-cmd\server.port" (
    set /p PORTA=<"logs\logs-cmd\server.port"
)

:detectar
:: Detectar qual interpretador usar (prioriza .venv local se estiver saudavel, senao usa global)
set PYTHON_EXEC=.\.venv\Scripts\python
set AMBIENTE_INFO=.venv local - Incompleto (Requer Opcao 4)

:: 1. Testar se o python global funciona e tem as dependencias
python -c "import PyPDF2, fastapi, fitz" >nul 2>&1
if not errorlevel 1 (
    set PYTHON_EXEC=python
    set AMBIENTE_INFO=Python Global - Saudavel
)

:: 2. Se o .venv local existir e tiver as dependencias, ele eh prioridade maxima
if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python -c "import PyPDF2, fastapi, fitz" >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_EXEC=.\.venv\Scripts\python
        set AMBIENTE_INFO=.venv local - Saudavel
    )
)

:menu
cls
echo.
echo ======================================================
echo         I LOVE SECURITY - CONSOLE DE OPERACOES
echo ======================================================
echo.
echo [1] Ligar Servidor (Porta Atual: %PORTA%)
echo [2] Desligar Servidor
echo [3] Ver Status da Porta %PORTA%
echo [4] Instalar/Atualizar Dependencias (.venv local)
echo [5] Sortear Nova Porta Aleatoria Livre
echo [6] Abrir Pasta do Projeto
echo [0] Sair
echo.
echo ======================================================
echo Ambiente: %AMBIENTE_INFO%
if not "%IP_LOCAL%"=="" echo IP Local:  %IP_LOCAL%
echo ======================================================
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto ligar
if "%opcao%"=="2" goto desligar
if "%opcao%"=="3" goto status
if "%opcao%"=="4" goto setup
if "%opcao%"=="5" goto sortear
if "%opcao%"=="6" goto pasta
if "%opcao%"=="0" exit
goto menu

:sortear
echo.
echo [!] Sorteando nova porta livre...
for /f "delims=" %%p in ('powershell -Command "$l = [System.Net.Sockets.TcpListener]0; $l.Start(); $p = $l.LocalEndpoint.Port; $l.Stop(); $p"') do set PORTA=%%p
echo [OK] Nova porta definida: %PORTA%
echo %PORTA%>"logs\logs-cmd\server.port"
echo [%time%] [!] Porta alterada/sorteada para: %PORTA% >> "%LOG_FILE%"
timeout /t 2 >nul
goto menu

:ligar
echo.
:: Verifica se o servidor ja esta rodando na porta atual
netstat -aon | findstr :%PORTA% >nul 2>&1
if %errorlevel% equ 0 (
    echo [!] AVISO: A porta %PORTA% ja parece estar em uso!
    echo [!] Tentando verificar se o uvicorn ja esta ativo...
    echo [%time%] [!] Tentativa de iniciar na porta %PORTA%, porem ja em uso. >> "%LOG_FILE%"
    timeout 3 > NUL
    goto menu
)

echo [+] Iniciando Servidor I Love Security...
echo [%time%] [+] Iniciando Backend na porta %PORTA% (%PYTHON_EXEC%)... >> "%LOG_FILE%"
set SERVER_LOG=logs\logs-cmd\server_background.log

:: Executa o interpretador detectado passando a porta
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c %PYTHON_EXEC% main.py %PORTA% > %SERVER_LOG% 2>&1' -WindowStyle Hidden"

echo [OK] Servidor iniciado em segundo plano (%AMBIENTE_INFO%).
echo [!] Abrindo o navegador...
timeout 3 > NUL
start http://localhost:%PORTA%
goto menu

:desligar
echo.
echo [-] Encerrando processos na porta %PORTA%...
echo [%time%] [-] Comando de encerramento enviado para porta %PORTA%... >> "%LOG_FILE%"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORTA%') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [%time%] [-] PID %%a finalizado. >> "%LOG_FILE%"
)
echo [!] Servicos interrompidos.
timeout 2 > NUL
goto menu

:status
echo.
echo [?] Verificando porta %PORTA%...
echo [%time%] [?] Verificando porta %PORTA%... >> "%LOG_FILE%"
netstat -aon | findstr :%PORTA%
if %errorlevel% neq 0 (
    echo.
    echo [OFFLINE] Servidor desligado na porta %PORTA%.
    echo [%time%] [STATUS] Servidor OFFLINE na porta %PORTA%. >> "%LOG_FILE%"
) else (
    echo.
    echo [ONLINE] Servidor operante na porta %PORTA%.
    echo [%time%] [STATUS] Servidor ONLINE na porta %PORTA%. >> "%LOG_FILE%"
)
pause
goto menu

:setup
echo.
echo [!] INICIANDO SETUP E ATUALIZACAO DE DEPENDENCIAS...
echo ------------------------------------------------------
echo [%time%] [!] Iniciando processo de Setup (.venv)... >> "%LOG_FILE%"

if not exist ".venv" (
    echo [!] Ambiente virtual (.venv) nao encontrado. Criando...
    python -m venv .venv
)

echo [+] Atualizando pip e instalando dependencias de requirements.txt...
echo [%time%] [>] Rodando pip install... >> "%LOG_FILE%"
powershell -Command ".\.venv\Scripts\python -m pip install --upgrade pip 2>&1 | Tee-Object -FilePath '%LOG_FILE%' -Append"
powershell -Command ".\.venv\Scripts\pip install -r requirements.txt 2>&1 | Tee-Object -FilePath '%LOG_FILE%' -Append"

echo.
echo [OK] Dependencias verificadas e configuradas no .venv.
echo [%time%] [OK] Setup finalizado. >> "%LOG_FILE%"
echo.
echo [!] Pressione qualquer tecla para voltar ao menu.
pause > NUL
goto detectar

:pasta
start .
goto menu
