import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path

import requests
from flask import Flask, jsonify, request
from google.cloud import storage

app = Flask(__name__)
REQUEST_SECRET = os.environ.get('YOUTUBE_PRACTICE_REQUEST_SECRET', '')
CALLBACK_SECRET = os.environ.get('YOUTUBE_PRACTICE_CALLBACK_SECRET', '')
CALLBACK_URL = os.environ.get('BASE44_CALLBACK_URL', '')
BUCKET_NAME = os.environ.get('AUDIO_TEMP_BUCKET', '')
CHORDMINI_URL = 'http://127.0.0.1:5001/api/recognize-chords'

def signature(secret, payload):
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

def authorized(raw):
    timestamp = request.headers.get('x-guitarraia-timestamp', '')
    received = request.headers.get('x-guitarraia-signature', '')
    try:
        recent = abs(int(time.time() * 1000) - int(timestamp)) <= 10 * 60 * 1000
    except ValueError:
        recent = False
    return bool(REQUEST_SECRET and recent and hmac.compare_digest(received, signature(REQUEST_SECRET, f'{timestamp}.{raw}')))

def callback(payload):
    if not CALLBACK_URL or not CALLBACK_SECRET:
        raise RuntimeError('Falta configurar BASE44_CALLBACK_URL o YOUTUBE_PRACTICE_CALLBACK_SECRET.')
    raw = json.dumps(payload, separators=(',', ':'))
    timestamp = str(int(time.time() * 1000))
    response = requests.post(CALLBACK_URL, data=raw, timeout=30, headers={
        'content-type': 'application/json',
        'x-guitarraia-timestamp': timestamp,
        'x-guitarraia-signature': signature(CALLBACK_SECRET, f'{timestamp}.{raw}'),
    })
    response.raise_for_status()

def canonical(chord):
    value = str(chord or '').strip().replace('♯', '#').replace('♭', 'b').lower()
    # Chord-recognition models often return C:maj or A:min whereas the
    # catalog uses C and Am. Normalize those equivalent spellings first.
    value = value.replace(':major', '').replace(':maj', '').replace(':minor', 'm').replace(':min', 'm')
    return value.replace('major', '').replace('maj', '').replace('minor', 'm').replace('min', 'm')

def basic_identity(chord):
    match = re.match(r'^([a-g](?:#|b)?)(m)?', canonical(chord))
    return f'{match.group(1)}{match.group(2) or ""}' if match else ''

def extract_rows(value):
    if isinstance(value, list):
        for item in value:
            yield from extract_rows(item)
    elif isinstance(value, dict):
        chord = value.get('chord') or value.get('label') or value.get('name')
        start = value.get('start') or value.get('time') or value.get('timestamp') or value.get('start_time')
        if chord is not None and start is not None:
            try:
                yield float(start), str(chord)
            except (TypeError, ValueError):
                pass
        for nested in value.values():
            if isinstance(nested, (dict, list)):
                yield from extract_rows(nested)

def normalise_result(result, allowed):
    aliases = {canonical(chord): chord for chord in allowed}
    by_identity = {}
    for chord in allowed:
        identity = basic_identity(chord)
        if identity:
            by_identity.setdefault(identity, []).append(chord)
    cues = []
    for moment, chord in extract_rows(result):
        exact = aliases.get(canonical(chord))
        # If the model only identified the triad, use it only when it maps
        # unambiguously to one chord family from this song's own cifrado.
        if not exact:
            candidates = by_identity.get(basic_identity(chord), [])
            if len(candidates) == 1:
                exact = candidates[0]
        if exact:
            if not cues or cues[-1]['chord'] != exact:
                cues.append({'time': round(max(0, moment), 2), 'chord': exact})
    cues.sort(key=lambda cue: cue['time'])
    deduped = []
    for cue in cues:
        if not deduped or cue['time'] > deduped[-1]['time']:
            deduped.append(cue)
    return deduped

def sections_from_cifrado(cues, sections):
    output = []
    cursor = 0
    for section in sections:
        target = canonical(section.get('firstChord'))
        for index in range(cursor, len(cues)):
            if canonical(cues[index]['chord']) == target:
                output.append({'time': cues[index]['time'], 'label': section.get('label') or 'Sección'})
                cursor = index + 1
                break
    return output or [{'time': cues[0]['time'], 'label': 'Inicio'}]

def process(payload):
    song_id = payload['song_id']
    video_id = payload['video_id']
    temp_dir = Path(tempfile.mkdtemp(prefix='guitarraia-'))
    audio = temp_dir / 'source.mp3'
    object_name = f'analysis/{song_id}/{int(time.time())}-{video_id}.mp3'
    blob = None
    try:
        # Source access is limited to the administrator-approved YouTube URL.
        subprocess.run(['yt-dlp', '--no-playlist', '-x', '--audio-format', 'mp3', '-o', str(audio), payload['video_url']], check=True, timeout=480)
        if not audio.exists():
            candidates = list(temp_dir.glob('source.*'))
            if not candidates:
                raise RuntimeError('No fue posible obtener un archivo de audio temporal.')
            audio = candidates[0]
        if BUCKET_NAME:
            blob = storage.Client().bucket(BUCKET_NAME).blob(object_name)
            blob.upload_from_filename(str(audio), content_type='audio/mpeg')
        with audio.open('rb') as handle:
            response = requests.post(CHORDMINI_URL, files={'file': ('source.mp3', handle, 'audio/mpeg')}, data={'model': 'chord-cnn-lstm'}, timeout=600)
        response.raise_for_status()
        result = response.json()
        cues = normalise_result(result, payload['catalog_chords'])
        if len(cues) < 2:
            raise RuntimeError('El análisis no encontró suficientes cambios que coincidan con el cifrado del catálogo.')
        matched = len(cues)
        confidence = min(0.98, max(0.35, matched / max(8, len(payload['catalog_chords']))))
        callback({'song_id': song_id, 'video_id': video_id, 'status': 'ready', 'map': {
            'version': 1, 'provider': 'ChordMini', 'confidence': round(confidence, 2),
            'analyzed_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'chord_cues': cues, 'sections': sections_from_cifrado(cues, payload.get('catalog_sections', [])),
        }})
    except Exception as error:
        callback({'song_id': song_id, 'video_id': video_id, 'status': 'error', 'error': str(error)[:500]})
    finally:
        if blob:
            try:
                blob.delete()
            except Exception:
                pass
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post('/analyze')
def analyze():
    raw = request.get_data(as_text=True)
    if not authorized(raw):
        return jsonify({'error': 'Unauthorized'}), 401
    payload = json.loads(raw)
    required = {'song_id', 'video_id', 'video_url', 'catalog_chords'}
    if not required.issubset(payload) or len(payload['catalog_chords']) < 2:
        return jsonify({'error': 'Solicitud incompleta.'}), 400
    threading.Thread(target=process, args=(payload,), daemon=True).start()
    return jsonify({'accepted': True}), 202

@app.get('/healthz')
def healthz():
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '8080')))
