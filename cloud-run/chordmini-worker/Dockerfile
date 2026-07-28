FROM python:3.10-slim

ARG CHORDMINI_REF=main
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git curl build-essential supervisor && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# ChordMini is MIT licensed. Pin CHORDMINI_REF to a reviewed commit before production.
RUN git clone --depth 1 --branch ${CHORDMINI_REF} https://github.com/ptnghia-j/ChordMiniApp.git /opt/source && \
    cp -R /opt/source/python_backend /opt/chordmini && \
    pip install --no-cache-dir -r /opt/chordmini/requirements.txt

WORKDIR /app
COPY requirements-worker.txt ./
RUN pip install --no-cache-dir -r requirements-worker.txt
COPY worker.py supervisord.conf ./

CMD ["/usr/bin/supervisord", "-c", "/app/supervisord.conf"]
