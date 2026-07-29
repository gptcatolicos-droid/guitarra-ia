FROM python:3.10-slim

ARG CHORDMINI_REF=main
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg fluidsynth git git-lfs curl build-essential supervisor libgomp1 && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# ChordMini is MIT licensed. Its chord/beat models are Git LFS assets and its
# recognition backend lives in python_backend/app.py. Pin CHORDMINI_REF to a
# reviewed commit before production, after confirming the project's license.
RUN git lfs install && \
    git clone --depth 1 --recurse-submodules --branch ${CHORDMINI_REF} https://github.com/ptnghia-j/ChordMiniApp.git /opt/source && \
    cd /opt/source && git lfs pull && \
    cp -R /opt/source/python_backend /opt/chordmini && \
    pip install --no-cache-dir --upgrade pip setuptools wheel "Cython>=0.29.0" numpy==1.26.4 && \
    pip install --no-cache-dir git+https://github.com/CPJKU/madmom && \
    grep -v '^spleeter==' /opt/chordmini/requirements.txt | grep -v '^typer==' > /tmp/requirements_nospleeter.txt && \
    pip install --no-cache-dir -r /tmp/requirements_nospleeter.txt && \
    pip install --no-cache-dir --no-deps typer==0.9.0 spleeter==2.3.2

WORKDIR /app
COPY requirements-worker.txt ./
RUN pip install --no-cache-dir -r requirements-worker.txt
COPY worker.py supervisord.conf ./

CMD ["/usr/bin/supervisord", "-c", "/app/supervisord.conf"]
