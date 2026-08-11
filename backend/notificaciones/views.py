# notificaciones/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from notificaciones.models import Notificacion
from utils.jwt_helper import verificar_token


def obtener_payload(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None, JsonResponse({'error': 'No autenticado'}, status=401)
    try:
        return verificar_token(auth.split(' ')[1]), None
    except ValueError as e:
        return None, JsonResponse({'error': str(e)}, status=401)


@require_http_methods(['GET'])
def listar_notificaciones(request):
    payload, error = obtener_payload(request)
    if error:
        return error

    solo_no_leidas = request.GET.get('noLeidas') == 'true'
    notifs = Notificacion.listar(payload['idUsuario'], solo_no_leidas)
    no_leidas = Notificacion.contar_no_leidas(payload['idUsuario'])

    return JsonResponse({
        'notificaciones': notifs,
        'noLeidas': no_leidas
    })


@csrf_exempt
@require_http_methods(['PUT'])
def marcar_leidas(request):
    payload, error = obtener_payload(request)
    if error:
        return error

    Notificacion.marcar_leidas(payload['idUsuario'])
    return JsonResponse({'mensaje': 'Notificaciones marcadas como leídas'})


@require_http_methods(['GET'])
def contar_no_leidas(request):
    payload, error = obtener_payload(request)
    if error:
        return error

    count = Notificacion.contar_no_leidas(payload['idUsuario'])
    return JsonResponse({'noLeidas': count})