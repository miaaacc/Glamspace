# utils/rate_limit.py
"""Límite de intentos (fuerza bruta) usando MongoDB como almacén."""

import time
from functools import wraps

from django.http import JsonResponse

from db.connection import get_collection


def get_rate_collection():
    return get_collection('rate_limits')


def permitir(clave, max_por_ventana, ventana_segundos):
    """
    Ventana deslizante simple por clave.
    Retorna (permitido, intentos_actuales).
    """
    col = get_rate_collection()
    ahora = time.time()
    expira = ahora + ventana_segundos

    doc = col.find_one({'_id': clave})
    if not doc:
        col.insert_one({'_id': clave, 'contador': 1, 'inicio': ahora, 'expira': expira})
        return True, 1

    if ahora > doc.get('expira', 0):
        col.update_one(
            {'_id': clave},
            {'$set': {'contador': 1, 'inicio': ahora, 'expira': expira}}
        )
        return True, 1

    nuevo = doc.get('contador', 0) + 1
    if nuevo > max_por_ventana:
        return False, doc.get('contador', max_por_ventana)

    col.update_one({'_id': clave}, {'$inc': {'contador': 1}})
    return True, nuevo


def obtener_ip(request):
    """IP del cliente, respetando proxies."""
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'desconocida')


def limpiar_rate_limits_antiguos(max_docs=5000):
    """Borra entradas expiradas (se puede llamar periódicamente)."""
    col = get_rate_collection()
    ahora = time.time()
    col.delete_many({'expira': {'$lt': ahora}})
    if col.count_documents({}) > max_docs:
        # Borrar las más antiguas
        for doc in col.find({}).sort('expira', 1).limit(100):
            col.delete_one({'_id': doc['_id']})


def limitar_intentos(max_por_ventana, ventana_segundos, usar_email=False):
    """
    Decorador que limita intentos por IP (y opcionalmente por email).
    Devuelve 429 con el mensaje si excede el límite.
    """
    def decorador(f):
        @wraps(f)
        def wrapper(request, *args, **kwargs):
            ip = obtener_ip(request)
            claves = [(f'ip:{ip}', max_por_ventana)]

            if usar_email:
                import json as _json
                email = ''
                try:
                    datos = _json.loads(request.body)
                    email = str(datos.get('email', '')).strip().lower()
                except Exception:
                    pass
                if email:
                    claves.append((f'email:{email}', max_por_ventana))

            for clave, limite in claves:
                permitido, _ = permitir(clave, limite, ventana_segundos)
                if not permitido:
                    return JsonResponse(
                        {'error': 'Demasiados intentos. Intenta de nuevo más tarde.'},
                        status=429
                    )
            return f(request, *args, **kwargs)
        return wrapper
    return decorador
