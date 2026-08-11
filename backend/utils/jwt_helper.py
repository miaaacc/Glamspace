# utils/jwt_helper.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings

ALGORITMO = 'HS256'
EXPIRACION_HORAS = 24

def crear_token(data: dict) -> str:
    """Crea un token JWT con los datos del usuario."""
    payload = data.copy()
    payload['exp'] = datetime.utcnow() + timedelta(hours=EXPIRACION_HORAS)
    payload['iat'] = datetime.utcnow()
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITMO)
    return token

def verificar_token(token: str) -> dict:
    """
    Verifica y decodifica un token JWT.
    Retorna los datos si es válido, lanza excepción si no.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITMO]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('El token ha expirado')
    except jwt.InvalidTokenError:
        raise ValueError('Token inválido')