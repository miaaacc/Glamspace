# usuarios/views.py

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from usuarios.models import Usuario, validar_password
from utils.jwt_helper import crear_token
from utils.auth_decorator import requiere_auth
from utils.validators import (
    validar_email,
    validar_username,
    sanitizar_texto,
    validar_longitud,
    validar_imagen_base64,
    validar_codigo_recuperacion,
)
from utils.rate_limit import limitar_intentos
from db.connection import get_collection
from notificaciones.models import Notificacion


@csrf_exempt
@require_http_methods(['POST'])
@limitar_intentos(max_por_ventana=10, ventana_segundos=300)
def registro(request):
    """Registra un nuevo usuario."""
    try:
        datos = json.loads(request.body)

        # Validar que llegaron todos los campos
        campos = ['username', 'email', 'password', 'nombre']

        for campo in campos:
            if not datos.get(campo):
                return JsonResponse(
                    {'error': f'El campo {campo} es obligatorio'},
                    status=400
                )

        # Validar formato del email
        error_email = validar_email(datos['email'])
        if error_email:
            return JsonResponse({'error': error_email}, status=400)

        # Validar formato del username
        error_username = validar_username(datos['username'])
        if error_username:
            return JsonResponse({'error': error_username}, status=400)

        # Validar longitud del nombre
        error_nombre = validar_longitud(datos['nombre'], 'nombre', 50)
        if error_nombre:
            return JsonResponse({'error': error_nombre}, status=400)

        # Validar requisitos de contraseña
        error_password = validar_password(datos['password'])
        if error_password:
            return JsonResponse(
                {'error': error_password},
                status=400
            )

        # Crear usuario (con valores saneados)
        usuario = Usuario.crear(
            username=sanitizar_texto(datos['username'], 20),
            email=str(datos['email']).strip().lower(),
            password=datos['password'],
            nombre=sanitizar_texto(datos['nombre'], 50)
        )

        # No devolver la contraseña
        usuario.pop('password', None)

        return JsonResponse({
            'mensaje': '¡Cuenta creada con éxito!',
            'usuario': usuario
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'JSON inválido'},
            status=400
        )

    except ValueError as e:
        return JsonResponse(
            {'error': str(e)},
            status=400
        )

    except Exception as e:
        print("🔥 ERROR EN REGISTRO:", repr(e))
        return JsonResponse(
            {'error': 'Error interno del servidor'},
            status=500
        )


@csrf_exempt
@require_http_methods(['POST'])
@limitar_intentos(max_por_ventana=10, ventana_segundos=300, usar_email=True)
def login(request):
    """Inicia sesión y retorna un token JWT."""
    try:
        datos = json.loads(request.body)

        email = str(datos.get('email', '')).strip().lower()
        password = datos.get('password', '')

        if not email or not password:
            return JsonResponse(
                {'error': 'Email y contraseña son obligatorios'},
                status=400
            )

        # Buscar usuario
        usuario = Usuario.buscar_por_email(email)

        if not usuario:
            return JsonResponse(
                {'error': 'Credenciales incorrectas'},
                status=401
            )

        # Verificar contraseña
        if not Usuario.verificar_password(
            password,
            usuario['password']
        ):
            return JsonResponse(
                {'error': 'Credenciales incorrectas'},
                status=401
            )

        # Crear token JWT
        token = crear_token({
            'idUsuario': usuario['idUsuario'],
            'username': usuario['username'],
            'email': usuario['email'],
            'rol': usuario['rol']
        })

        # No devolver la contraseña
        usuario.pop('password', None)

        return JsonResponse({
            'mensaje': '¡Bienvenida!',
            'token': token,
            'usuario': usuario
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'JSON inválido'},
            status=400
        )

    except Exception as e:
        print("🔥 ERROR EN LOGIN:", repr(e))
        return JsonResponse(
            {'error': 'Error interno del servidor'},
            status=500
        )


@requiere_auth
@require_http_methods(['GET'])
def perfil_propio(request):
    """Retorna el perfil del usuario autenticado."""
    usuario = Usuario.buscar_por_id(request.usuario_id)

    if not usuario:
        return JsonResponse(
            {'error': 'Usuario no encontrado'},
            status=404
        )

    usuario.pop('password', None)

    return JsonResponse({
        'usuario': usuario
    })


@csrf_exempt
@require_http_methods(['POST'])
@limitar_intentos(max_por_ventana=5, ventana_segundos=300, usar_email=True)
def solicitar_recuperacion(request):
    """
    Solicita un código de recuperación de contraseña.
    En producción el código se envía por correo; aquí se devuelve
    en la respuesta porque no hay SMTP configurado.
    """
    try:
        datos = json.loads(request.body)
        email = str(datos.get('email', '')).strip().lower()

        if not email:
            return JsonResponse({'error': 'El correo es obligatorio'}, status=400)

        error_email = validar_email(email)
        if error_email:
            return JsonResponse({'error': error_email}, status=400)

        usuario, codigo = Usuario.solicitar_recuperacion(email)

        # No exponer datos sensibles
        usuario.pop('password', None)
        usuario.pop('codigoRecuperacion', None)
        usuario.pop('expiraRecuperacion', None)

        return JsonResponse({
            'mensaje': 'Código enviado a tu correo',
            'codigo': codigo,  # solo para demo (no hay SMTP)
            'email': usuario['email']
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        print("🔥 ERROR SOLICITANDO RECUPERACIÓN:", repr(e))
        return JsonResponse({'error': 'Error interno'}, status=500)


@csrf_exempt
@require_http_methods(['POST'])
@limitar_intentos(max_por_ventana=5, ventana_segundos=300, usar_email=True)
def cambiar_password(request):
    """Valida el código y cambia la contraseña del usuario."""
    try:
        datos = json.loads(request.body)
        email    = str(datos.get('email', '')).strip().lower()
        codigo   = str(datos.get('codigo', '')).strip()
        password = datos.get('password', '')

        if not email or not codigo or not password:
            return JsonResponse({'error': 'Completa todos los campos'}, status=400)

        error_email = validar_email(email)
        if error_email:
            return JsonResponse({'error': error_email}, status=400)

        error_codigo = validar_codigo_recuperacion(codigo)
        if error_codigo:
            return JsonResponse({'error': error_codigo}, status=400)

        error_password = validar_password(password)
        if error_password:
            return JsonResponse({'error': error_password}, status=400)

        Usuario.cambiar_password(email, codigo, password)

        return JsonResponse({'mensaje': 'Contraseña actualizada correctamente'})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        print("🔥 ERROR CAMBIANDO CONTRASEÑA:", repr(e))
        return JsonResponse({'error': 'Error interno'}, status=500)


@csrf_exempt
@require_http_methods(['GET'])
def ver_perfil(request, id_usuario):
    """
    Ver el perfil de cualquier usuario.
    Si es el propio, también indica que puede editarlo.
    """
    usuario = Usuario.buscar_por_id(id_usuario)

    if not usuario:
        return JsonResponse(
            {'error': 'Usuario no encontrado'},
            status=404
        )

    usuario.pop('password', None)

    # Verificar si el visitante lo sigue
    es_propio = False
    lo_sigo = False

    auth = request.headers.get('Authorization', '')

    if auth.startswith('Bearer '):
        try:
            from utils.jwt_helper import verificar_token

            payload = verificar_token(auth.split(' ')[1])

            id_visitante = payload['idUsuario']

            es_propio = id_visitante == id_usuario
            lo_sigo = id_visitante in usuario.get(
                'seguidores',
                []
            )

        except ValueError:
            pass

    # Conteos
    usuario['totalSeguidores'] = len(
        usuario.get('seguidores', [])
    )

    usuario['totalSiguiendo'] = len(
        usuario.get('siguiendo', [])
    )

    # No exponer listas completas de IDs
    usuario.pop('seguidores', None)
    usuario.pop('siguiendo', None)

    return JsonResponse({
        'usuario': usuario,
        'esPropio': es_propio,
        'loSigo': lo_sigo
    })


@csrf_exempt
@require_http_methods(['PUT'])
def editar_perfil(request):
    """Edita el perfil del usuario autenticado."""

    auth = request.headers.get('Authorization', '')

    if not auth.startswith('Bearer '):
        return JsonResponse(
            {'error': 'No autenticado'},
            status=401
        )

    try:
        from utils.jwt_helper import verificar_token

        payload = verificar_token(
            auth.split(' ')[1]
        )

    except ValueError as e:
        return JsonResponse(
            {'error': str(e)},
            status=401
        )

    try:
        datos = json.loads(request.body)

        # Sanear y validar campos editables
        saneados = {}

        if 'nombre' in datos:
            error_nombre = validar_longitud(datos['nombre'], 'nombre', 50)
            if error_nombre:
                return JsonResponse({'error': error_nombre}, status=400)
            saneados['nombre'] = sanitizar_texto(datos['nombre'], 50)

        if 'biografia' in datos:
            error_bio = validar_longitud(datos['biografia'], 'biografia', 200)
            if error_bio:
                return JsonResponse({'error': error_bio}, status=400)
            saneados['biografia'] = sanitizar_texto(datos['biografia'], 200)

        if 'fotoPerfil' in datos:
            if datos['fotoPerfil'] == '':
                saneados['fotoPerfil'] = ''
            else:
                error_foto, _ = validar_imagen_base64(
                    datos['fotoPerfil'], campo='fotoPerfil', max_kb=10240
                )
                if error_foto:
                    return JsonResponse({'error': error_foto}, status=400)
                saneados['fotoPerfil'] = datos['fotoPerfil']

        if not saneados:
            return JsonResponse({'error': 'No hay campos válidos para actualizar'}, status=400)

        usuario = Usuario.actualizar_perfil(
            payload['idUsuario'],
            saneados
        )

        usuario.pop('password', None)

        return JsonResponse({
            'mensaje': 'Perfil actualizado',
            'usuario': usuario
        })

    except ValueError as e:
        return JsonResponse(
            {'error': str(e)},
            status=400
        )

    except Exception as e:
        print("🔥 ERROR EDITANDO PERFIL:", repr(e))

        return JsonResponse(
            {'error': 'Error interno'},
            status=500
        )


@csrf_exempt
@require_http_methods(['POST'])
def seguir_usuario(request, id_usuario):
    """Sigue o deja de seguir a un usuario (toggle)."""

    auth = request.headers.get('Authorization', '')

    if not auth.startswith('Bearer '):
        return JsonResponse(
            {'error': 'No autenticado'},
            status=401
        )

    try:
        from utils.jwt_helper import verificar_token

        payload = verificar_token(
            auth.split(' ')[1]
        )

    except ValueError as e:
        return JsonResponse(
            {'error': str(e)},
            status=401
        )

    if payload['idUsuario'] == id_usuario:
        return JsonResponse(
            {'error': 'No puedes seguirte a ti misma'},
            status=400
        )

    try:
        ahora_sigue = Usuario.seguir(
            payload['idUsuario'],
            id_usuario
        )

        # ── Notificación ────────────────────────────────────────
        usuarios_col = get_collection('usuarios')
        seguidor = usuarios_col.find_one({'idUsuario': payload['idUsuario']})
        foto_emisor = seguidor.get('fotoPerfil', '') if seguidor else ''

        if ahora_sigue:
            Notificacion.crear(
                id_receptor=id_usuario,
                id_emisor=payload['idUsuario'],
                username_emisor=payload['username'],
                foto_emisor=foto_emisor,
                tipo='seguidor',
                id_referencia=''
            )
        else:
            Notificacion.eliminar_si_existe(
                id_receptor=id_usuario,
                id_emisor=payload['idUsuario'],
                tipo='seguidor',
                id_referencia=''
            )

        return JsonResponse({
            'siguiendo': ahora_sigue,
            'mensaje': (
                'Siguiendo'
                if ahora_sigue
                else 'Dejaste de seguir'
            )
        })

    except ValueError as e:
        return JsonResponse(
            {'error': str(e)},
            status=404
        )


@require_http_methods(['GET'])
def seguidores_usuario(request, id_usuario):
    """Obtiene los seguidores de un usuario."""

    lista = Usuario.listar_seguidores(id_usuario)

    return JsonResponse({
        'seguidores': lista
    })


@require_http_methods(['GET'])
def siguiendo_usuario(request, id_usuario):
    """Obtiene los usuarios que sigue un usuario."""

    lista = Usuario.listar_siguiendo(id_usuario)

    return JsonResponse({
        'siguiendo': lista
    })


@require_http_methods(['GET'])
def buscar_usuarios(request):
    """Busca usuarios por username o nombre (?q=...)."""

    q = request.GET.get('q', '').strip()
    if not q:
        return JsonResponse({'usuarios': []})

    lista = Usuario.buscar(q)

    return JsonResponse({
        'usuarios': lista
    })