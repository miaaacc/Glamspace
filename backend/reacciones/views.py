# reacciones/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from reacciones.models import Reaccion
from utils.jwt_helper import verificar_token
from db.connection import get_collection
from notificaciones.models import Notificacion


def obtener_payload(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None, JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        return verificar_token(auth.split(' ')[1]), None
    except ValueError as e:
        return None, JsonResponse({'error': str(e)}, status=401)


@csrf_exempt
@require_http_methods(['POST'])
def togglear_reaccion(request, id_publicacion):
    """Agrega o quita una reacción y gestiona notificaciones."""
    payload, error = obtener_payload(request)
    if error:
        return error

    try:
        datos = json.loads(request.body)
        tipo = datos.get('tipoReaccion', '')

        accion, totales = Reaccion.togglear(
            id_publicacion=id_publicacion,
            id_usuario=payload['idUsuario'],
            tipo_reaccion=tipo
        )

        # Gestionar notificación
        publicaciones_col = get_collection('publicaciones')
        pub = publicaciones_col.find_one({'idPublicacion': id_publicacion})

        if pub and pub.get('idUsuario') != payload['idUsuario']:
            id_dueno = pub['idUsuario']

            # Obtener foto del emisor
            usuarios_col = get_collection('usuarios')
            emisor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
            foto_emisor = emisor.get('fotoPerfil', '') if emisor else ''

            if accion == 'agregada':
                Notificacion.crear(
                    id_receptor=id_dueno,
                    id_emisor=payload['idUsuario'],
                    username_emisor=payload['username'],
                    foto_emisor=foto_emisor,
                    tipo='like',
                    id_referencia=id_publicacion,
                    texto_referencia=pub.get('titulo', '')
                )
            else:
                # Quitó el like → eliminar notificación
                Notificacion.eliminar_si_existe(
                    id_receptor=id_dueno,
                    id_emisor=payload['idUsuario'],
                    tipo='like',
                    id_referencia=id_publicacion
                )

        return JsonResponse({'accion': accion, 'totales': totales})

    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Error interno'}, status=500)


@require_http_methods(['GET'])
def info_reacciones(request, id_publicacion):
    totales = Reaccion.contar_por_tipo(id_publicacion)
    mis_reacciones = []

    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        try:
            payload = verificar_token(auth.split(' ')[1])
            mis_reacciones = Reaccion.reacciones_del_usuario(
                id_publicacion, payload['idUsuario']
            )
        except ValueError:
            pass

    return JsonResponse({'totales': totales, 'misReacciones': mis_reacciones})