import hashlib
import hmac
import json
import os
import re
import shutil
import tempfile
import threading
import time
from pathlib import Path

import requests
from flask import Flask, jsonify, request
from google.cloud import storage

app = Flask(__name__)
REQUEST_SECRET = os.environ.get('YOUTUBE_PRACTICE_REQUEST_SECRET', '')
UPLOAD_SECRET = os.environ.get('YOUTUBE_PRACTICE_UPLOAD_SECRET', '')
CALLBACK_SECRET = os.environ.get('YOUTUBE_PRACTICE_CALLBACK_SECRET', '')
CALLBACK_URL = os.environ.get('BASE44_CALLBACK_URL', '')
BUCKET_NAME = os.environ.get('AUDIO_TEMP_BUCKET', '')
CHORDMINI_URL = os.environ.get('CHORDMINI_URL', 'http://127.0.0.1:5001/api/recognize-chords')
MAX_AUDIO_BYTES = int(os.environ.get('MAX_AUDIO_BYTES', str(80 * 1024 * 1024)))
ALLOWED_ORIGINS = {item.strip() for item in os.environ.get('ALLOWED_ORIGINS', '').split(',') if item.strip()}
ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.m4a', '.aac', '.ogg'}


def signature(secret, payload):
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def secret_fingerprint(secret):
    return hashlib.sha256(secret.encode()).hexdigest()[:16] if secret else 'missing'


def recent(timestamp):
    try:
        return abs(int(time.time() * 1000) - int(timestamp)) <= 10 * 60 * 1000
    except (TypeError, ValueError):
        return False


def cors(response):
    origin = request.headers.get('Origin', '')
    if origin and (not ALLOWED_ORIGINS or origin in ALLOWED_ORIGINS):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Headers'] = 'content-type,x-guitarraia-timestamp,x-guitarraia-signature,x-guitarraia-song-id,x-guitarraia-object-name'
        response.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    return response


@app.after_request
def after_request(response):
    return cors(response)


@app.route('/upload', methods=['OPTIONS'])
def upload_options():
    return '', 204


def request_authorized(raw):
    timestamp = request.headers.get('x-guitarraia-timestamp', '')
    received = request.headers.get('x-guitarraia-signature', '')
    return bool(REQUEST_SECRET and recent(timestamp) and hmac.compare_digest(received, signature(REQUEST_SECRET, timestamp + '.' + raw)))


def upload_authorized(song_id, object_name):
    timestamp = request.headers.get('x-guitarraia-timestamp', '')
    received = request.headers.get('x-guitarraia-signature', '')
    payload = timestamp + '.' + song_id + '.' + object_name
    return bool(UPLOAD_SECRET and recent(timestamp) and hmac.compare_digest(received, signature(UPLOAD_SECRET, payload)))


def valid_object_name(song_id, object_name):
    pattern = r'^incoming/' + re.escape(song_id) + r'/[a-f0-9-]{16,80}\.(mp3|wav|m4a|aac|ogg)$'
    return bool(re.match(pattern, object_name or '', re.I))


def callback(payload):
    if not CALLBACK_URL or not CALLBACK_SECRET:
        raise RuntimeError('Falta configurar BASE44_CALLBACK_URL o YOUTUBE_PRACTICE_CALLBACK_SECRET.')
    raw = json.dumps(payload, separators=(',', ':'))
    timestamp = str(int(time.time() * 1000))
    response = requests.post(CALLBACK_URL, data=raw, timeout=30, headers={
        'content-type': 'application/json',
        'x-guitarraia-timestamp': timestamp,
        'x-guitarraia-signature': signature(CALLBACK_SECRET, timestamp + '.' + raw),
    })
    response.raise_for_status()


def canonical(chord):
    value = str(chord or '').strip().replace('♯', '#').replace('♭', 'b').lower()
    value = value.replace(':major', '').replace(':maj', '').replace(':minor', 'm').replace(':min', 'm')
    return value.replace('major', '').replace('maj', '').replace('minor', 'm').replace('min', 'm')


def basic_identity(chord):
    match = re.match(r'^([a-g](?:#|b)?)(m)?', canonical(chord))
    return (match.group(1) + (match.group(2) or '')) if match else ''


def extract_rows(value):
    if isinstance(value, list):
        if len(value) >= 2 and isinstance(value[0], (int, float)) and isinstance(value[1], str):
            yield float(value[0]), value[1]
        for item in value:
            yield from extract_rows(item)
    elif isinstance(value, dict):
        chord = value.get('chord') or value.get('label') or value.get('name')
        start = value.get('start') or value.get('time') or value.get('timestamp') or value.get('start_time') or value.get('startTime') or value.get('offset')
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
    candidates = []
    for moment, chord in extract_rows(result):
        matched = aliases.get(canonical(chord))
        if not matched:
            options = by_identity.get(basic_identity(chord), [])
            if len(options) == 1:
                matched = options[0]
        if matched:
            candidates.append({'time': round(max(0, moment), 2), 'chord': matched})
    candidates.sort(key=lambda cue: cue['time'])
    cues = []
    for cue in candidates:
        if not cues or (cue['time'] > cues[-1]['time'] and cue['chord'] != cues[-1]['chord']):
            cues.append(cue)
    return cues


def sections_from_cifrado(cues, sections):
    output, cursor = [], 0
    for section in sections:
        target = canonical(section.get('firstChord'))
        for index in range(cursor, len(cues)):
            if canonical(cues[index]['chord']) == target:
                output.append({'time': cues[index]['time'], 'label': section.get('label') or 'Sección'})
                cursor = index + 1
                break
    return output or [{'time': cues[0]['time'], 'label': 'Inicio'}]


def process(payload):
    song_id, video_id = payload['song_id'], payload['video_id']
    object_name = payload['audio_object_name']
    temp_dir = Path(tempfile.mkdtemp(prefix='guitarraia-'))
    audio_path = temp_dir / ('source' + Path(object_name).suffix.lower())
    blob = None
    try:
        callback({'song_id': song_id, 'video_id': video_id, 'status': 'processing'})
        if not BUCKET_NAME:
            raise RuntimeError('Falta configurar AUDIO_TEMP_BUCKET.')
        blob = storage.Client().bucket(BUCKET_NAME).blob(object_name)
        if not blob.exists():
            raise RuntimeError('El audio privado ya no está disponible. Sube el archivo nuevamente.')
        blob.download_to_filename(str(audio_path))
        with audio_path.open('rb') as handle:
            response = requests.post(
                CHORDMINI_URL,
                files={'file': ('source' + audio_path.suffix, handle, request_mime(audio_path.suffix))},
                data={'model': 'chord-cnn-lstm'},
                timeout=900,
            )
        response.raise_for_status()
        cues = normalise_result(response.json(), payload['catalog_chords'])
        if len(cues) < 2:
            raise RuntimeError('ChordMini no encontró suficientes cambios que coincidan con el cifrado del catálogo.')
        confidence = min(0.98, max(0.35, len(cues) / max(8, len(payload['catalog_chords']))))
        callback({
            'song_id': song_id,
            'video_id': video_id,
            'status': 'ready',
            'map': {
                'version': 2,
                'provider': 'ChordMini',
                'source': 'admin_private_audio',
                'confidence': round(confidence, 2),
                'analyzed_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'chord_cues': cues,
                'sections': sections_from_cifrado(cues, payload.get('catalog_sections', [])),
                'sections_estimated': True,
            },
        })
    except Exception as error:
        try:
            callback({'song_id': song_id, 'video_id': video_id, 'status': 'error', 'error': str(error)[:500]})
        except Exception:
            app.logger.exception('No se pudo reportar el error a Base44')
    finally:
        if blob:
            try:
                blob.delete()
            except Exception:
                app.logger.exception('No se pudo borrar el audio temporal')
        shutil.rmtree(temp_dir, ignore_errors=True)


def request_mime(extension):
    return {
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
        '.aac': 'audio/aac', '.ogg': 'audio/ogg',
    }.get(extension, 'application/octet-stream')


@app.post('/upload')
def upload():
    song_id = request.headers.get('x-guitarraia-song-id', '')
    object_name = request.headers.get('x-guitarraia-object-name', '')
    timestamp = request.headers.get('x-guitarraia-timestamp', '')
    received_signature = request.headers.get('x-guitarraia-signature', '')

    if not UPLOAD_SECRET:
        return jsonify({
            'error': 'upload_secret_missing',
            'upload_secret_fingerprint': secret_fingerprint(UPLOAD_SECRET),
        }), 503
    if not recent(timestamp):
        return jsonify({'error': 'expired_or_invalid_timestamp'}), 401
    if not valid_object_name(song_id, object_name):
        return jsonify({
            'error': 'invalid_object_name',
            'song_id_present': bool(song_id),
            'object_name_prefix_ok': bool(object_name.startswith('incoming/' + song_id + '/')) if song_id else False,
        }), 400

    expected_signature = signature(UPLOAD_SECRET, timestamp + '.' + song_id + '.' + object_name)
    if not received_signature or not hmac.compare_digest(received_signature, expected_signature):
        return jsonify({
            'error': 'invalid_signature',
            'upload_secret_fingerprint': secret_fingerprint(UPLOAD_SECRET),
            'timestamp_present': bool(timestamp),
            'song_id_present': bool(song_id),
            'object_name_present': bool(object_name),
        }), 401
    if not BUCKET_NAME:
        return jsonify({'error': 'AUDIO_TEMP_BUCKET no está configurado.'}), 503
    if request.content_length is not None and request.content_length > MAX_AUDIO_BYTES:
        return jsonify({'error': 'El audio supera el límite permitido.'}), 413
    try:
        blob = storage.Client().bucket(BUCKET_NAME).blob(object_name)
        blob.upload_from_file(request.stream, content_type=request.content_type or request_mime(Path(object_name).suffix))
        if blob.size and blob.size > MAX_AUDIO_BYTES:
            blob.delete()
            return jsonify({'error': 'El audio supera el límite permitido.'}), 413
        return jsonify({'ok': True}), 201
    except Exception as error:
        app.logger.exception('Carga privada fallida')
        return jsonify({'error': str(error)[:300]}), 500


@app.post('/analyze')
def analyze():
    raw = request.get_data(as_text=True)
    if not request_authorized(raw):
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        payload = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return jsonify({'error': 'JSON inválido.'}), 400
    required = {'song_id', 'video_id', 'audio_object_name', 'catalog_chords'}
    if not required.issubset(payload) or len(payload['catalog_chords']) < 2 or not valid_object_name(payload['song_id'], payload['audio_object_name']):
        return jsonify({'error': 'Solicitud incompleta.'}), 400
    threading.Thread(target=process, args=(payload,), daemon=True).start()
    return jsonify({'accepted': True}), 202


@app.get('/health')
def health():
    return jsonify({
        'ok': True,
        'storage': bool(BUCKET_NAME),
        'chordmini_url': CHORDMINI_URL,
        'upload_secret_fingerprint': secret_fingerprint(UPLOAD_SECRET),
        'request_secret_fingerprint': secret_fingerprint(REQUEST_SECRET),
        'callback_secret_fingerprint': secret_fingerprint(CALLBACK_SECRET),
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '8080')))
