# utils/middleware.py
"""Middleware de seguridad personalizado."""

import json

from django.http import JsonResponse

# Límite máximo del body (64 MB: admite hasta 4 imágenes de 10 MB en base64 ~53 MB)
MAX_BODY_BYTES = 64 * 1024 * 1024


class LimitarTamanoBodyMiddleware:
    """Rechaza peticiones con cuerpo mayor a MAX_BODY_BYTES."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        longitud = request.META.get('CONTENT_LENGTH')
        if longitud:
            try:
                if int(longitud) > MAX_BODY_BYTES:
                    return JsonResponse(
                        {'error': 'El cuerpo de la petición es demasiado grande'},
                        status=413
                    )
            except ValueError:
                return JsonResponse(
                    {'error': 'Content-Length inválido'},
                    status=400
                )
        return self.get_response(request)
