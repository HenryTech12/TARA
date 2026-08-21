FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code and the demo dataset are baked into the image so it can run
# standalone, with no host bind mounts — seed_demo_data.py resolves the
# dataset relative to its own file location (backend/scripts/../../data),
# which lands on /data once backend/ is copied to /app.
COPY backend/ .
COPY data/ /data/

RUN useradd --create-home --shell /bin/bash tara \
    && chown -R tara:tara /app /data
USER tara

# Render (and several other PaaS hosts) inject PORT at runtime and route
# traffic to whatever port the process actually binds — hardcoding 8000
# here would silently break their health checks if PORT differs. Falls
# back to 8000 for local `docker run`/docker-compose, where nothing sets it.
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\", 8000)}/health', timeout=3)" || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
