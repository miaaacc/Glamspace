# usuarios/models.py
from db.connection import get_collection
from datetime import datetime, timedelta
import bcrypt
import uuid
import secrets
import re


def validar_password(password):
    """Valida que la contraseña cumpla requisitos de seguridad.
    Retorna un mensaje de error o None si es válida."""
    if len(password) < 8:
        return 'La contraseña debe tener al menos 8 caracteres'
    if not re.search(r'[A-Z]', password):
        return 'La contraseña debe tener al menos una letra mayúscula'
    if not re.search(r'[a-z]', password):
        return 'La contraseña debe tener al menos una letra minúscula'
    if not re.search(r'[0-9]', password):
        return 'La contraseña debe tener al menos un número'
    if not re.search(r'[^A-Za-z0-9]', password):
        return 'La contraseña debe tener al menos un carácter especial'
    return None

def get_usuarios():
    return get_collection('usuarios')

class Usuario:
    
    @staticmethod
    def crear(username, email, password, nombre):
        """Crea un nuevo usuario en MongoDB."""
        usuarios = get_usuarios()
        
        # Verificar si el email o username ya existe (insensible a mayúsculas)
        email_patron = re.compile(f'^{re.escape(email)}$', re.IGNORECASE)
        username_patron = re.compile(f'^{re.escape(username)}$', re.IGNORECASE)
        if usuarios.find_one({'email': email_patron}):
            raise ValueError('El email ya está registrado')
        if usuarios.find_one({'username': username_patron}):
            raise ValueError('El username ya está en uso')
        
        # Hashear la contraseña
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        usuario = {
        'idUsuario': str(uuid.uuid4()),
        'username': username,
        'email': email,
        'password': password_hash,
        'nombre': nombre,
        'rol': 'usuario',
        'biografia': '',
        'fotoPerfil': '',
        'seguidores': [],
        'siguiendo': [],
        'createdAt': datetime.utcnow().isoformat()
}
        
        resultado = usuarios.insert_one(usuario)
        usuario['_id'] = str(resultado.inserted_id)
        return usuario
    
    @staticmethod
    def buscar_por_email(email):
        """Busca un usuario por email (insensible a mayúsculas)."""
        usuarios = get_usuarios()
        patron = re.compile(f'^{re.escape(email)}$', re.IGNORECASE)
        usuario = usuarios.find_one({'email': patron})
        if usuario:
            usuario['_id'] = str(usuario['_id'])
        return usuario
    
    @staticmethod
    def buscar_por_id(id_usuario):
        """Busca un usuario por su idUsuario."""
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'idUsuario': id_usuario})
        if usuario:
            usuario['_id'] = str(usuario['_id'])
        return usuario
    
    @staticmethod
    def verificar_password(password_plano, password_hash):
        """Verifica si la contraseña es correcta."""
        return bcrypt.checkpw(
            password_plano.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    @staticmethod
    def actualizar_perfil(id_usuario, datos):
        """Actualiza biografía y/o foto de perfil."""
        usuarios = get_usuarios()

        campos_permitidos = ['nombre', 'biografia', 'fotoPerfil']
        actualizacion = {}

        for campo in campos_permitidos:
            if campo in datos:
                actualizacion[campo] = datos[campo]

        if not actualizacion:
            raise ValueError('No hay campos válidos para actualizar')

        usuarios.update_one(
            {'idUsuario': id_usuario},
            {'$set': actualizacion}
        )

        return Usuario.buscar_por_id(id_usuario)

    @staticmethod
    def seguir(id_seguidor, id_objetivo):
        """
        El usuario id_seguidor sigue a id_objetivo.
        Retorna True si siguió, False si dejó de seguir (toggle).
        """
        usuarios = get_usuarios()

        objetivo = usuarios.find_one({'idUsuario': id_objetivo})
        if not objetivo:
            raise ValueError('Usuario no encontrado')

        ya_sigue = id_seguidor in objetivo.get('seguidores', [])

        if ya_sigue:
            # Dejar de seguir
            usuarios.update_one(
                {'idUsuario': id_objetivo},
                {'$pull': {'seguidores': id_seguidor}}
            )
            usuarios.update_one(
                {'idUsuario': id_seguidor},
                {'$pull': {'siguiendo': id_objetivo}}
            )
            return False
        else:
            # Seguir
            usuarios.update_one(
                {'idUsuario': id_objetivo},
                {'$addToSet': {'seguidores': id_seguidor}}
            )
            usuarios.update_one(
                {'idUsuario': id_seguidor},
                {'$addToSet': {'siguiendo': id_objetivo}}
            )
            return True

    @staticmethod
    def solicitar_recuperacion(email):
        """
        Genera un código de recuperación de 6 dígitos con expiración
        de 15 minutos. Retorna (usuario, codigo).
        """
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'email': email})
        if not usuario:
            raise ValueError('No existe una cuenta con ese correo')

        codigo = f"{secrets.randbelow(1000000):06d}"
        expira = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

        usuarios.update_one(
            {'_id': usuario['_id']},
            {'$set': {
                'codigoRecuperacion': codigo,
                'expiraRecuperacion': expira
            }}
        )
        return Usuario.buscar_por_id(usuario['idUsuario']), codigo

    @staticmethod
    def cambiar_password(email, codigo, password):
        """
        Valida el código de recuperación y actualiza la contraseña.
        """
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'email': email})
        if not usuario:
            raise ValueError('No existe una cuenta con ese correo')

        codigo_guardado = usuario.get('codigoRecuperacion', '')
        expira = usuario.get('expiraRecuperacion', '')

        if not codigo_guardado or not expira:
            raise ValueError('No hay una recuperación en curso')

        if codigo != codigo_guardado:
            raise ValueError('El código es incorrecto')

        expira_dt = datetime.fromisoformat(expira)
        if datetime.utcnow() > expira_dt:
            raise ValueError('El código expiró, solicita uno nuevo')

        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        usuarios.update_one(
            {'_id': usuario['_id']},
            {'$set': {'password': password_hash},
             '$unset': {'codigoRecuperacion': '', 'expiraRecuperacion': ''}}
        )
        return True

    @staticmethod
    def buscar_por_username(username):
        """Busca un usuario por su username."""
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'username': username})
        if usuario:
            usuario['_id'] = str(usuario['_id'])
        return usuario

    @staticmethod
    def buscar(q, limite=20):
        """Busca usuarios por username o nombre (insensible a mayúsculas)."""
        import re
        usuarios = get_usuarios()
        patron = re.compile(re.escape(q), re.IGNORECASE)
        cursor = usuarios.find(
            {'$or': [{'username': patron}, {'nombre': patron}]}
        ).limit(limite)
        return [{
            'idUsuario': u['idUsuario'],
            'username': u['username'],
            'nombre': u.get('nombre', ''),
            'fotoPerfil': u.get('fotoPerfil', ''),
        } for u in cursor]

    @staticmethod
    def listar_seguidores(id_usuario):
        """Retorna la lista de seguidores con sus datos básicos."""
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'idUsuario': id_usuario})
        if not usuario:
            return []

        ids = usuario.get('seguidores', [])
        resultado = []
        for uid in ids:
            u = usuarios.find_one({'idUsuario': uid})
            if u:
                resultado.append({
                    'idUsuario': u['idUsuario'],
                    'username': u['username'],
                    'nombre': u['nombre'],
                    'fotoPerfil': u.get('fotoPerfil', '')
                })
        return resultado

    @staticmethod
    def listar_siguiendo(id_usuario):
        """Retorna la lista de usuarios que sigue."""
        usuarios = get_usuarios()
        usuario = usuarios.find_one({'idUsuario': id_usuario})
        if not usuario:
            return []

        ids = usuario.get('siguiendo', [])
        resultado = []
        for uid in ids:
            u = usuarios.find_one({'idUsuario': uid})
            if u:
                resultado.append({
                    'idUsuario': u['idUsuario'],
                    'username': u['username'],
                    'nombre': u['nombre'],
                    'fotoPerfil': u.get('fotoPerfil', '')
                })
        return resultado