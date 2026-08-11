# publicaciones/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from publicaciones.models import Publicacion
from categorias.models import Categoria
from utils.jwt_helper import verificar_token
from utils.validators import (
    sanitizar_texto,
    validar_pagina,
    validar_lista_imagenes,
    validar_imagen_base64,
)
from db.connection import get_collection
from favoritos.models import Favorito


def obtener_payload_opcional(request):
    """Intenta obtener el payload pero no falla si no hay token."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        return verificar_token(auth.split(' ')[1])
    except ValueError:
        return None


def enriquecer_con_favoritos(publicaciones, id_usuario):
    """Marca qué publicaciones son favoritas del usuario."""
    if not id_usuario:
        return publicaciones
    ids = [p['idPublicacion'] for p in publicaciones]
    favoritos_set = Favorito.ids_favoritos(id_usuario, ids)
    for p in publicaciones:
        p['esFavorito'] = p['idPublicacion'] in favoritos_set
    return publicaciones


def enriquecer_con_foto_perfil(publicaciones):
    """Agrega la foto de perfil del autor a cada publicación."""
    if not publicaciones:
        return publicaciones
    ids = [p['idUsuario'] for p in publicaciones]
    usuarios_col = get_collection('usuarios')
    fotos = {
        u['idUsuario']: u.get('fotoPerfil', '')
        for u in usuarios_col.find({'idUsuario': {'$in': ids}})
    }
    for p in publicaciones:
        p['fotoPerfil'] = fotos.get(p['idUsuario'], '')
    return publicaciones


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def publicaciones(request):
    if request.method == 'GET':
        payload = obtener_payload_opcional(request)
        id_usuario = payload['idUsuario'] if payload else None

        id_categoria = request.GET.get('categoria')
        pagina       = validar_pagina(request.GET.get('pagina', 1))
        tab          = request.GET.get('tab', 'parati')  # parati | siguiendo | tendencias

        if tab == 'siguiendo' and id_usuario:
            # Solo publicaciones de usuarios que sigo
            usuarios_col = get_collection('usuarios')
            yo = usuarios_col.find_one({'idUsuario': id_usuario})
            siguiendo_ids = yo.get('siguiendo', []) if yo else []

            if not siguiendo_ids:
                return JsonResponse({'publicaciones': [], 'total': 0, 'pagina': 1, 'paginas': 0})

            publicaciones_col = get_collection('publicaciones')
            filtro = {'estado': 'activo', 'idUsuario': {'$in': siguiendo_ids}}
            if id_categoria:
                filtro['idCategoria'] = id_categoria

            saltar = (pagina - 1) * 10
            cursor = publicaciones_col.find(filtro).sort('fechaPublicacion', -1).skip(saltar).limit(10)
            lista = []
            for pub in cursor:
                pub['_id'] = str(pub['_id'])
                if hasattr(pub.get('fechaPublicacion'), 'isoformat'):
                    pub['fechaPublicacion'] = pub['fechaPublicacion'].isoformat()
                lista.append(pub)
            total = publicaciones_col.count_documents(filtro)
            lista = enriquecer_con_favoritos(lista, id_usuario)
            lista = enriquecer_con_foto_perfil(lista)
            return JsonResponse({'publicaciones': lista, 'total': total, 'pagina': pagina, 'paginas': (total + 9) // 10})

        elif tab == 'tendencias':
            lista, total = Publicacion.listar(id_categoria, pagina, orden_tendencias=True)
        else:
            lista, total = Publicacion.listar(id_categoria, pagina)

        lista = enriquecer_con_favoritos(lista, id_usuario)
        lista = enriquecer_con_foto_perfil(lista)
        return JsonResponse({'publicaciones': lista, 'total': total, 'pagina': pagina, 'paginas': (total + 9) // 10})

    # POST — crear publicación
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        payload = verificar_token(auth.split(' ')[1])
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=401)

    try:
        datos = json.loads(request.body)
        titulo       = sanitizar_texto(datos.get('titulo', ''), 100)
        descripcion  = sanitizar_texto(datos.get('descripcion', ''), 2000)
        id_categoria = str(datos.get('idCategoria', '')).strip()
        fotos        = datos.get('fotos', [])
        videos       = datos.get('videos', [])

        if not titulo:
            return JsonResponse({'error': 'El título es obligatorio'}, status=400)
        if not descripcion:
            return JsonResponse({'error': 'La descripción es obligatoria'}, status=400)
        if not id_categoria:
            return JsonResponse({'error': 'Selecciona una categoría'}, status=400)
        if len(titulo) > 100:
            return JsonResponse({'error': 'El título es demasiado largo'}, status=400)
        if len(descripcion) > 2000:
            return JsonResponse({'error': 'La descripción es demasiado larga'}, status=400)

        # Validar imágenes base64 (máx 4 fotos de 3 MB)
        error_fotos, fotos_validas = validar_lista_imagenes(fotos, max_cant=4, max_kb=10240)
        if error_fotos:
            return JsonResponse({'error': error_fotos}, status=400)

        # Validar videos (máx 2, mismo formato data URL)
        if videos is not None:
            if not isinstance(videos, list):
                return JsonResponse({'error': 'videos debe ser una lista'}, status=400)
            if len(videos) > 2:
                return JsonResponse({'error': 'Máximo 2 videos por publicación'}, status=400)
            for i, v in enumerate(videos):
                error_video, _ = validar_imagen_base64(v, campo=f'video {i+1}', max_kb=10240)
                if error_video:
                    return JsonResponse({'error': error_video}, status=400)
        else:
            videos = []

        publicacion = Publicacion.crear(
            id_usuario=payload['idUsuario'],
            username=payload['username'],
            titulo=titulo,
            descripcion=descripcion,
            id_categoria=id_categoria,
            fotos=fotos_validas,
            videos=videos
        )
        return JsonResponse({'mensaje': '¡Publicación creada!', 'publicacion': publicacion}, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception:
        return JsonResponse({'error': 'Error interno'}, status=500)


@csrf_exempt
@require_http_methods(['GET', 'DELETE'])
def publicacion_detalle(request, id_publicacion):
    pub = Publicacion.buscar_por_id(id_publicacion)
    if not pub:
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)

    if request.method == 'GET':
        payload = obtener_payload_opcional(request)
        if payload:
            pub['esFavorito'] = Favorito.es_favorito(payload['idUsuario'], id_publicacion)
        else:
            pub['esFavorito'] = False
        pub = enriquecer_con_foto_perfil([pub])[0]
        return JsonResponse({'publicacion': pub})

    # DELETE
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        payload = verificar_token(auth.split(' ')[1])
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=401)

    if payload['rol'] in ['admin', 'moderador']:
        eliminado = Publicacion.eliminar_como_admin(id_publicacion)
    else:
        eliminado = Publicacion.eliminar(id_publicacion, payload['idUsuario'])

    if not eliminado:
        return JsonResponse({'error': 'No puedes eliminar esta publicación'}, status=403)
    return JsonResponse({'mensaje': 'Publicación eliminada'})


@require_http_methods(['GET'])
def categorias_lista(request):
    cats = Categoria.listar()
    return JsonResponse({'categorias': cats})


@require_http_methods(['GET'])
def publicaciones_usuario(request, id_usuario):
    lista = Publicacion.listar_por_usuario(id_usuario)
    payload = obtener_payload_opcional(request)
    if payload:
        lista = enriquecer_con_favoritos(lista, payload['idUsuario'])
    lista = enriquecer_con_foto_perfil(lista)
    return JsonResponse({'publicaciones': lista})