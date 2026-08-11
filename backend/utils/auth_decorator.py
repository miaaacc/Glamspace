# utils/auth_decorator.py
from functools import wraps
from django.http import JsonResponse
from utils.jwt_helper import verificar_token

def requiere_auth(f):
    """
    Decorador que protege una vista.
    Verifica el token JWT en el header Authorization.
    """
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Token no proporcionado'},
                status=401
            )
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = verificar_token(token)
            request.usuario_id = payload.get('idUsuario')
            request.usuario_rol = payload.get('rol')
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=401)
        
        return f(request, *args, **kwargs)
    return wrapper


def requiere_rol(*roles):
    """
    Decorador que verifica el rol del usuario.
    Uso: @requiere_rol('admin', 'moderador')
    """
    def decorador(f):
        @wraps(f)
        @requiere_auth
        def wrapper(request, *args, **kwargs):
            if request.usuario_rol not in roles:
                return JsonResponse(
                    {'error': 'No tienes permisos para esta acción'},
                    status=403
                )
            return f(request, *args, **kwargs)
        return wrapper
    return decorador