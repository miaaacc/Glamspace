# utils/validators.py
"""Validaciones y saneamiento de entrada compartidos por todas las apps."""

import re
import base64
from html import escape

from django.core.validators import validate_email
from django.core.exceptions import ValidationError


# ── Texto ────────────────────────────────────────────────────

def sanitizar_texto(texto, max_len=None):
    """
    Limpia texto de entrada:
    - Convierte a str y quita espacios.
    - Elimina etiquetas HTML (anti-XSS por capas).
    - Recorta a max_len si se indica.
    """
    if texto is None:
        return ''
    texto = str(texto).strip()
    # Quitar etiquetas HTML/script de forma agresiva
    texto = re.sub(r'<[^>]*>', '', texto)
    # Escapar cualquier resto peligroso (por si se renderiza como HTML)
    texto = escape(texto, quote=True)
    if max_len is not None:
        texto = texto[:max_len]
    return texto


def validar_longitud(valor, campo, max_len):
    """Devuelve un mensaje de error si el valor supera max_len."""
    if valor is None:
        return f'El campo {campo} es obligatorio'
    texto = str(valor).strip()
    if not texto:
        return f'El campo {campo} no puede estar vacío'
    if len(texto) > max_len:
        return f'El campo {campo} es demasiado largo (máx {max_len} caracteres)'
    return None


# ── Email ────────────────────────────────────────────────────

def validar_email(email, max_len=254):
    """Devuelve un mensaje de error si el email es inválido o None si es válido."""
    if not email or not str(email).strip():
        return 'El email es obligatorio'
    email = str(email).strip().lower()
    if len(email) > max_len:
        return 'El email es demasiado largo'
    try:
        validate_email(email)
    except ValidationError:
        return 'El email no tiene un formato válido'
    return None


# ── Username ─────────────────────────────────────────────────

RE_USERNAME = re.compile(r'^[a-zA-Z0-9_]{3,20}$')


def validar_username(username):
    """Devuelve un mensaje de error si el username es inválido o None si es válido."""
    if not username or not str(username).strip():
        return 'El username es obligatorio'
    username = str(username).strip()
    if len(username) < 3:
        return 'El username debe tener al menos 3 caracteres'
    if len(username) > 20:
        return 'El username debe tener como máximo 20 caracteres'
    if not RE_USERNAME.match(username):
        return 'El username solo puede contener letras, números y guion bajo (_)'
    return None


# ── Imágenes base64 ──────────────────────────────────────────

def validar_imagen_base64(data_url, campo='imagen', max_kb=10240):
    """
    Valida que un data URL sea una imagen base64 válida y no exceda max_kb.
    Devuelve (None, None) si es válida, o (error, detalle).
    """
    if not data_url or not str(data_url).strip():
        return 'La imagen no puede estar vacía', None

    data_url = str(data_url)
    if not data_url.startswith('data:image/'):
        return f'El campo {campo} no es una imagen válida', None

    try:
        header, separador, payload = data_url.partition(',')
        if not separador:
            raise ValueError('sin data')
        mime = header[5:header.index(';')] if ';' in header else header[5:]
        if mime not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif'):
            return f'Formato de imagen no permitido ({mime})', None
        # Normalizar base64 (permitir espacios y saltos de línea)
        limpio = re.sub(r'\s+', '', payload)
        bytes_img = base64.b64decode(limpio, validate=True)
    except Exception:
        return f'El campo {campo} tiene datos corruptos', None

    tamano_kb = len(bytes_img) / 1024
    if tamano_kb > max_kb:
        return f'La imagen pesa {tamano_kb:.0f} KB (máx {max_kb} KB)', None

    return None, bytes_img


def validar_lista_imagenes(fotos, max_cant=4, max_kb=10240):
    """Valida una lista de imágenes base64. Devuelve (error, lista_normalizada)."""
    if fotos is None:
        return None, []
    if not isinstance(fotos, list):
        return 'fotos debe ser una lista', []
    if len(fotos) > max_cant:
        return f'Máximo {max_cant} fotos por publicación', []
    if len(fotos) == 0:
        return None, []
    for i, foto in enumerate(fotos):
        error, _ = validar_imagen_base64(foto, campo=f'foto {i+1}', max_kb=max_kb)
        if error:
            return error, []
    return None, fotos


# ── Varios ───────────────────────────────────────────────────

def validar_pagina(valor):
    """Convierte un valor de página a entero >= 1. Devuelve 1 si es inválido."""
    try:
        pagina = int(valor)
    except (TypeError, ValueError):
        return 1
    return pagina if pagina >= 1 else 1


def validar_codigo_recuperacion(codigo):
    """Valida que el código de recuperación tenga 6 dígitos."""
    if not codigo or not re.fullmatch(r'\d{6}', str(codigo).strip()):
        return 'El código debe tener 6 dígitos'
    return None
