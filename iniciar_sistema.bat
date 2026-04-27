@echo off
color 0B
title Painel de Controle - I Love Security

:: Captura o IP local (IPv4) da maquina de forma inteligente
:: Ignora adaptadores VM e falhas de idioma pegando a rota principal
for /f "delims=" %%i in ('python -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()"') do set IP_LOCAL=%%i

:MENU
cls
echo          I LOVE SECURITY (Local Web App Launcher)
echo =======================================================
echo.
echo    [1] Ligar o Sistema (Abre o servidor nos bastidores)
echo    [2] Desligar o Sistema (Forca o fechamento da porta)
echo    [0] Sair do Painel
echo.
echo =======================================================
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto LIGAR
if "%opcao%"=="2" goto DESLIGAR
if "%opcao%"=="0" exit

echo Opcao invalida! Tente novamente.
timeout /t 2 >nul
goto MENU

:LIGAR
cls
echo =======================================================
echo [ INICIALIZANDO SERVIDOR FASTAPI ]
echo =======================================================
echo.
echo -Iniciando o Motor Python (Backend na Porta 8001)...
:: Inicia o uvicorn silenciosamente usando o python global (ignorando o .venv)
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c python main.py' -WindowStyle Hidden"

echo.
echo Tudo iniciado! O servidor esta rodando de forma invisivel.
echo.
echo Acesse na sua maquina:      http://localhost:8001/
if not "%IP_LOCAL%"=="" (
    echo Acesse de outras maquinas:  http://%IP_LOCAL%:8001/
)
echo.
echo Pressione qualquer tecla para voltar ao Menu...
pause >nul
goto MENU

:DESLIGAR
cls
echo =======================================================
echo [ ENCERRANDO SERVIDOR ]
echo =======================================================
echo.
echo -Cacando e encerrando o Backend (Porta 8001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /F /PID %%a >nul 2>&1

echo.
echo Servico derrubado com sucesso! A memoria esta livre.
echo.
echo Pressione qualquer tecla para voltar ao Menu...
pause >nul
goto MENU
