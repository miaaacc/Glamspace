from django.shortcuts import render

# Create your views here.
# mensajes/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from mensajes.models import Mensaje
from publicaciones.models import Publicacion
from utils.jwt_helper import verificar_token
from utils.validators import sanitizar_texto, validar_longitud
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
@require_http_methods(['GET', 'POST'])
def mensajes_conversacion(request, id_otro):
    payload, error = obtener_payload(request)
    if error:
        return error

    if request.method == 'GET':
        msgs = Mensaje.conversacion(payload['idUsuario'], id_otro)
        # Obtener info del otro usuario
        usuarios = get_collection('usuarios')
        otro = usuarios.find_one({'idUsuario': id_otro})
        otro_info = {}
        if otro:
            otro_info = {
                'idUsuario': otro['idUsuario'],
                'username': otro['username'],
                'fotoPerfil': otro.get('fotoPerfil', '')
            }

        # Marcar mensajes de publicación cuya publicación ya no existe
        ids_publicaciones = {
            m['idPublicacion'] for m in msgs
            if m.get('tipo') == 'publicacion' and m.get('idPublicacion')
        }
        if ids_publicaciones:
            publicaciones_col = get_collection('publicaciones')
            existentes = set(
                p['idPublicacion']
                for p in publicaciones_col.find(
                    {'idPublicacion': {'$in': list(ids_publicaciones)}},
                    {'idPublicacion': 1}
                )
            )
            for m in msgs:
                if m.get('tipo') == 'publicacion' and m.get('idPublicacion') not in existentes:
                    m['publicacionEliminada'] = True

        return JsonResponse({'mensajes': msgs, 'otroUsuario': otro_info})

    try:
        datos = json.loads(request.body)
        contenido = sanitizar_texto(datos.get('contenido', ''), 1000)

        error_longitud = validar_longitud(contenido, 'mensaje', 1000)
        if error_longitud:
            return JsonResponse({'error': error_longitud}, status=400)

        msg = Mensaje.enviar(
            id_remitente=payload['idUsuario'],
            username_remitente=payload['username'],
            id_destinatario=id_otro,
            contenido=contenido
        )

        # ── Notificación al destinatario ────────────────────────
        if id_otro != payload['idUsuario']:
            usuarios_col = get_collection('usuarios')
            emisor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
            foto_emisor = emisor.get('fotoPerfil', '') if emisor else ''
            Notificacion.crear(
                id_receptor=id_otro,
                id_emisor=payload['idUsuario'],
                username_emisor=payload['username'],
                foto_emisor=foto_emisor,
                tipo='mensaje',
                id_referencia=msg['idMensaje'],
                texto_referencia=msg.get('contenido', '')[:120]
            )

        return JsonResponse({'mensaje': msg}, status=201)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(['POST'])
def compartir_publicacion(request):
    payload, error = obtener_payload(request)
    if error:
        return error

    try:
        datos = json.loads(request.body)
        id_publicacion = datos.get('idPublicacion', '')
        id_destinatario = datos.get('idDestinatario', '')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    if not id_publicacion or not id_destinatario:
        return JsonResponse({'error': 'Faltan datos'}, status=400)

    if id_destinatario == payload['idUsuario']:
        return JsonResponse({'error': 'No puedes compartirte una publicación a ti mismo'}, status=400)

    usuarios_col = get_collection('usuarios')
    destinatario = usuarios_col.find_one({'idUsuario': id_destinatario})
    if not destinatario:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    pub = Publicacion.buscar_por_id(id_publicacion)
    if not pub or pub.get('estado') != 'activo':
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)

    emisor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
    foto_emisor = emisor.get('fotoPerfil', '') if emisor else ''

    fotos = pub.get('fotos') or []
    msg = Mensaje.enviar(
        id_remitente=payload['idUsuario'],
        username_remitente=payload['username'],
        id_destinatario=id_destinatario,
        contenido='',
        tipo='publicacion',
        id_publicacion=pub['idPublicacion'],
        titulo_publicacion=pub.get('titulo', ''),
        foto_publicacion=fotos[0] if fotos else '',
        autor_publicacion=pub.get('username', ''),
    )

    Notificacion.crear(
        id_receptor=id_destinatario,
        id_emisor=payload['idUsuario'],
        username_emisor=payload['username'],
        foto_emisor=foto_emisor,
        tipo='compartido',
        id_referencia=pub['idPublicacion'],
        texto_referencia=pub.get('titulo', '')[:120],
    )

    return JsonResponse({'mensaje': msg}, status=201)


@require_http_methods(['GET'])
def hilos_mensajes(request):
    payload, error = obtener_payload(request)
    if error:
        return error

    hilos = Mensaje.hilos(payload['idUsuario'])
    # Enriquecer con datos de usuarios
    usuarios_col = get_collection('usuarios')
    for hilo in hilos:
        u = usuarios_col.find_one({'idUsuario': hilo['idOtro']})
        if u:
            hilo['usernameOtro'] = u['username']
            hilo['fotoOtro'] = u.get('fotoPerfil', '')
    return JsonResponse({'hilos': hilos})