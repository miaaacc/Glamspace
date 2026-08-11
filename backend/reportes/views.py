from django.shortcuts import render

# Create your views here.
# reportes/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from reportes.models import Reporte, MOTIVOS
from utils.jwt_helper import verificar_token
from utils.auth_decorator import requiere_auth, requiere_rol
from utils.validators import sanitizar_texto, validar_longitud
from db.connection import get_collection
from db.stats import get_estadisticas_generales

def obtener_payload(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None, JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        return verificar_token(auth.split(' ')[1]), None
    except ValueError as e:
        return None, JsonResponse({'error': str(e)}, status=401)


# ─── Reportes ────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(['POST'])
def crear_reporte(request, id_publicacion):
    """Cualquier usuario puede reportar una publicación."""
    payload, error = obtener_payload(request)
    if error:
        return error

    try:
        datos = json.loads(request.body)
        motivo = str(datos.get('motivo', '')).strip()
        descripcion = sanitizar_texto(datos.get('descripcion', ''), 500)

        if motivo not in MOTIVOS:
            return JsonResponse({'error': f'Motivo inválido. Usa: {MOTIVOS}'}, status=400)

        error_longitud = validar_longitud(descripcion, 'descripción', 500)
        if error_longitud and descripcion:
            return JsonResponse({'error': error_longitud}, status=400)

        reporte = Reporte.crear(
            id_publicacion=id_publicacion,
            id_usuario=payload['idUsuario'],
            motivo=motivo,
            descripcion=descripcion
        )
        return JsonResponse({
            'mensaje': 'Reporte enviado. Lo revisaremos pronto.',
            'reporte': reporte
        }, status=201)

    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception:
        return JsonResponse({'error': 'Error interno'}, status=500)


# ─── Panel Admin ──────────────────────────────────────────────

@require_http_methods(['GET'])
def panel_estadisticas(request):
    """Estadísticas generales — solo admin/moderador."""
    payload, error = obtener_payload(request)
    if error:
        return error
    if payload['rol'] not in ['admin', 'moderador']:
        return JsonResponse({'error': 'Sin permisos'}, status=403)

    stats = get_estadisticas_generales()
    stats['reportes'] = Reporte.estadisticas()
    return JsonResponse({'estadisticas': stats})


@require_http_methods(['GET'])
def listar_reportes(request):
    """Lista reportes pendientes — solo admin/moderador."""
    payload, error = obtener_payload(request)
    if error:
        return error
    if payload['rol'] not in ['admin', 'moderador']:
        return JsonResponse({'error': 'Sin permisos'}, status=403)

    estado = request.GET.get('estado', 'pendiente')
    reportes = Reporte.listar(estado)
    return JsonResponse({'reportes': reportes})


@csrf_exempt
@require_http_methods(['PUT'])
def resolver_reporte(request, id_reporte):
    """Resuelve o descarta un reporte — solo admin/moderador."""
    payload, error = obtener_payload(request)
    if error:
        return error
    if payload['rol'] not in ['admin', 'moderador']:
        return JsonResponse({'error': 'Sin permisos'}, status=403)

    try:
        datos = json.loads(request.body)
        accion = datos.get('accion', '')

        if accion not in ['resuelto', 'descartado']:
            return JsonResponse(
                {'error': 'Acción inválida. Usa: resuelto | descartado'},
                status=400
            )

        Reporte.resolver(id_reporte, accion)
        mensaje = 'Publicación eliminada' if accion == 'resuelto' else 'Reporte descartado'
        return JsonResponse({'mensaje': mensaje})

    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=404)


@require_http_methods(['GET'])
def listar_usuarios_admin(request):
    """Lista todos los usuarios — solo admin."""
    payload, error = obtener_payload(request)
    if error:
        return error
    if payload['rol'] != 'admin':
        return JsonResponse({'error': 'Solo el admin puede ver esto'}, status=403)

    usuarios_col = get_collection('usuarios')
    cursor = usuarios_col.find({}).sort('createdAt', -1)
    resultado = []
    for u in cursor:
        u['_id'] = str(u['_id'])
        u.pop('password', None)
        if 'createdAt' in u:
           if hasattr(u['createdAt'], 'isoformat'):
            u['createdAt'] = u['createdAt'].isoformat()
        resultado.append(u)

    return JsonResponse({'usuarios': resultado})


@csrf_exempt
@require_http_methods(['PUT'])
def cambiar_rol(request, id_usuario):
    """Cambia el rol de un usuario — solo admin."""
    payload, error = obtener_payload(request)
    if error:
        return error
    if payload['rol'] != 'admin':
        return JsonResponse({'error': 'Solo el admin puede cambiar roles'}, status=403)

    try:
        datos = json.loads(request.body)
        nuevo_rol = datos.get('rol', '')

        if nuevo_rol not in ['usuario', 'moderador', 'admin']:
            return JsonResponse({'error': 'Rol inválido'}, status=400)

        if id_usuario == payload['idUsuario']:
            return JsonResponse(
                {'error': 'No puedes cambiar tu propio rol'},
                status=400
            )

        usuarios_col = get_collection('usuarios')
        resultado = usuarios_col.update_one(
            {'idUsuario': id_usuario},
            {'$set': {'rol': nuevo_rol}}
        )

        if resultado.modified_count == 0:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        return JsonResponse({
            'mensaje': f'Rol actualizado a {nuevo_rol}'
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)


@require_http_methods(['GET'])
def motivos_reporte(request):
    """Retorna los motivos válidos de reporte."""
    return JsonResponse({'motivos': MOTIVOS})