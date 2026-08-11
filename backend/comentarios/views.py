from django.shortcuts import render

# Create your views here.
# comentarios/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from comentarios.models import Comentario
from utils.jwt_helper import verificar_token
from utils.validators import sanitizar_texto
from db.connection import get_collection
from notificaciones.models import Notificacion, extraer_menciones

def obtener_payload(request):
    """Helper: extrae y verifica el token del header."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None, JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        return verificar_token(auth.split(' ')[1]), None
    except ValueError as e:
        return None, JsonResponse({'error': str(e)}, status=401)


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def comentarios_publicacion(request, id_publicacion):
    """GET: listar comentarios | POST: crear comentario."""

    if request.method == 'GET':
        lista = Comentario.listar_por_publicacion(id_publicacion)
        return JsonResponse({'comentarios': lista})

    # POST
    payload, error = obtener_payload(request)
    if error:
        return error

    try:
        datos = json.loads(request.body)
        contenido = sanitizar_texto(datos.get('contenido', ''), 500)

        if not contenido:
            return JsonResponse({'error': 'El comentario no puede estar vacío'}, status=400)
        if len(contenido) > 500:
            return JsonResponse({'error': 'El comentario es demasiado largo'}, status=400)

        comentario = Comentario.crear(
            id_publicacion=id_publicacion,
            id_usuario=payload['idUsuario'],
            username=payload['username'],
            contenido=contenido
        )

        # ── Notificaciones ──────────────────────────────────────
        usuarios_col = get_collection('usuarios')
        publicaciones_col = get_collection('publicaciones')

        emisor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
        foto_emisor = emisor.get('fotoPerfil', '') if emisor else ''

        # Incluir la foto del autor en el comentario recién creado
        comentario['fotoPerfil'] = foto_emisor

        pub = publicaciones_col.find_one({'idPublicacion': id_publicacion})

        # Notificar al dueño de la publicación (no a uno mismo)
        if pub and pub.get('idUsuario') != payload['idUsuario']:
            Notificacion.crear(
                id_receptor=pub['idUsuario'],
                id_emisor=payload['idUsuario'],
                username_emisor=payload['username'],
                foto_emisor=foto_emisor,
                tipo='comentario',
                id_referencia=id_publicacion,
                texto_referencia=contenido[:120]
            )

        # Notificar a usuarios mencionados (@username)
        for nombre in extraer_menciones(contenido):
            mencionado = usuarios_col.find_one({'username': nombre})
            if not mencionado:
                continue
            id_mencionado = mencionado['idUsuario']
            if id_mencionado == payload['idUsuario']:
                continue  # No notificarse a uno mismo
            if pub and id_mencionado == pub.get('idUsuario'):
                continue  # El dueño ya recibe la de "comentó tu publicación"
            Notificacion.crear(
                id_receptor=id_mencionado,
                id_emisor=payload['idUsuario'],
                username_emisor=payload['username'],
                foto_emisor=foto_emisor,
                tipo='mencion',
                id_referencia=id_publicacion,
                texto_referencia=contenido[:120]
            )

        return JsonResponse({'comentario': comentario}, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception:
        return JsonResponse({'error': 'Error interno'}, status=500)


@csrf_exempt
@require_http_methods(['DELETE'])
def eliminar_comentario(request, id_comentario):
    """Elimina un comentario propio."""
    payload, error = obtener_payload(request)
    if error:
        return error

    comentarios_col = get_collection('comentarios')
    comentario = comentarios_col.find_one({'idComentario': id_comentario})

    eliminado = Comentario.eliminar(id_comentario, payload['idUsuario'])
    if not eliminado:
        return JsonResponse(
            {'error': 'No puedes eliminar este comentario'},
            status=403
        )

    # Eliminar la notificación asociada al comentario (si existe)
    if comentario:
        publicaciones_col = get_collection('publicaciones')
        pub = publicaciones_col.find_one({'idPublicacion': comentario['idPublicacion']})
        if pub and pub.get('idUsuario') != payload['idUsuario']:
            Notificacion.eliminar_si_existe(
                id_receptor=pub['idUsuario'],
                id_emisor=payload['idUsuario'],
                tipo='comentario',
                id_referencia=comentario['idPublicacion']
            )

    return JsonResponse({'mensaje': 'Comentario eliminado'})