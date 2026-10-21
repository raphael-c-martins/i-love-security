# I Love Security - Privacy-First Document & Image Suite
FROM python:3.11-slim-bookworm

# Evita prompts interativos durante a instalação
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalação de dependências de sistema para compressão PDF e conversão Word
# ghostscript: motor de compressão PDF
# libreoffice-writer + libreoffice-nogui: motor headless leve de conversão DOCX -> PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    libreoffice-writer \
    libreoffice-nogui \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o código-fonte da aplicação
COPY . .

# Garante a existência das pastas de logs e feedbacks
RUN mkdir -p logs/logs-cmd feedbacks/Solucionados

# Exposição da porta padrão
EXPOSE 8001

# Healthcheck da aplicação
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
