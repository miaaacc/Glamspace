# favoritos/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from favoritos.models import Favorito
from publicaciones.models import Publicacion
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
def toggle_favorito(request, id_publicacion):
    """Agrega o quita un favorito (toggle)."""
    payload, error = obtener_payload(request)
    if error:
        return error

    guardado = Favorito.toggle(payload['idUsuario'], id_publicacion)

    # ── Notificación al dueño de la publicación ────────────────
    pub = Publicacion.buscar_por_id(id_publicacion)
    if pub and pub.get('idUsuario') != payload['idUsuario']:
        usuarios_col = get_collection('usuarios')
        emisor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
        foto_emisor = emisor.get('fotoPerfil', '') if emisor else ''

        if guardado:
            Notificacion.crear(
                id_receptor=pub['idUsuario'],
                id_emisor=payload['idUsuario'],
                username_emisor=payload['username'],
                foto_emisor=foto_emisor,
                tipo='favorito',
                id_referencia=id_publicacion,
                texto_referencia=pub.get('titulo', '')[:120]
            )
        else:
            Notificacion.eliminar_si_existe(
                id_receptor=pub['idUsuario'],
                id_emisor=payload['idUsuario'],
                tipo='favorito',
                id_referencia=id_publicacion
            )

    return JsonResponse({
        'guardado': guardado,
        'mensaje': 'Guardado en favoritos' if guardado else 'Eliminado de favoritos'
    })


@require_http_methods(['GET'])
def mis_favoritos(request):
    """
    Retorna las publicaciones completas que el usuario tiene en favoritos.
    Solo el propio usuario puede verlos.
    """
    payload, error = obtener_payload(request)
    if error:
        return error

    ids = Favorito.listar_de_usuario(payload['idUsuario'])

    publicaciones = []
    for id_pub in ids:
        pub = Publicacion.buscar_por_id(id_pub)
        if pub and pub.get('estado') == 'activo':
            pub['esFavorito'] = True
            publicaciones.append(pub)

    return JsonResponse({'favoritos': publicaciones})


@require_http_methods(['GET'])
def estado_favorito(request, id_publicacion):
    """Verifica si una publicación específica está en favoritos."""
    payload, error = obtener_payload(request)
    if error:
        return error

    es_fav = Favorito.es_favorito(payload['idUsuario'], id_publicacion)
    return JsonResponse({'esFavorito': es_fav})