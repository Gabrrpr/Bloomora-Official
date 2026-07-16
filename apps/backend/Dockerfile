FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install runtime system dependencies only. Python packages install from wheels,
# so compiler toolchains are intentionally excluded to keep deploy images small.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini

# Expose the API port
EXPOSE 8000

# Start Uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
