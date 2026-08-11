# notificaciones/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_notificaciones():
    return get_collection('notificaciones')

# Tipos extensibles fácilmente
TIPOS = {
    'like':       'dio like a tu publicación',
    'comentario': 'comentó tu publicación',
    'seguidor':   'empezó a seguirte',
    'mencion':    'te mencionó en un comentario',
    'favorito':   'guardó tu publicación en favoritos',
    'mensaje':    'te envió un mensaje',
    'compartido': 'te compartió una publicación',
}

def extraer_menciones(texto):
    """Extrae los @username mencionados en un texto (sin duplicados)."""
    if not texto:
        return []
    import re
    return list(dict.fromkeys(re.findall(r'@(\w+)', texto)))

class Notificacion:

    @staticmethod
    def crear(id_receptor, id_emisor, username_emisor, foto_emisor,
               tipo, id_referencia, texto_referencia=''):
        """
        Crea una notificación.
        Evita duplicados del mismo emisor + tipo + referencia.

        id_receptor      → usuario que recibe la notificación
        id_emisor        → usuario que realizó la acción
        tipo             → 'like' | 'comentario' | 'seguidor' | 'mencion'
        id_referencia    → idPublicacion o idComentario según el tipo
        texto_referencia → texto opcional para preview
        """
        if id_receptor == id_emisor:
            return None  # No notificarse a uno mismo

        col = get_notificaciones()

        # Evitar duplicado: mismo emisor, tipo y referencia
        existente = col.find_one({
            'idReceptor':   id_receptor,
            'idEmisor':     id_emisor,
            'tipo':         tipo,
            'idReferencia': id_referencia,
        })
        if existente:
            return None

        notif = {
            'idNotificacion':  str(uuid.uuid4()),
            'idReceptor':      id_receptor,
            'idEmisor':        id_emisor,
            'usernameEmisor':  username_emisor,
            'fotoEmisor':      foto_emisor or '',
            'tipo':            tipo,
            'idReferencia':    id_referencia,
            'textoReferencia': texto_referencia,
            'leida':           False,
            'fecha':           datetime.utcnow(),
        }
        col.insert_one(notif)
        notif['_id'] = str(notif['_id'])
        notif['fecha'] = notif['fecha'].isoformat()
        return notif

    @staticmethod
    def eliminar_si_existe(id_receptor, id_emisor, tipo, id_referencia):
        """
        Elimina la notificación cuando se deshace la acción.
        Ejemplo: quitar like → eliminar notificación de like.
        """
        col = get_notificaciones()
        col.delete_one({
            'idReceptor':   id_receptor,
            'idEmisor':     id_emisor,
            'tipo':         tipo,
            'idReferencia': id_referencia,
        })

    @staticmethod
    def listar(id_usuario, solo_no_leidas=False):
        """Lista las notificaciones del usuario, más recientes primero."""
        col = get_notificaciones()
        filtro = {'idReceptor': id_usuario}
        if solo_no_leidas:
            filtro['leida'] = False

        cursor = col.find(filtro).sort('fecha', -1).limit(50)
        resultado = []
        for n in cursor:
            n['_id'] = str(n['_id'])
            if isinstance(n['fecha'], datetime):
                n['fecha'] = n['fecha'].isoformat()
            resultado.append(n)
        return resultado

    @staticmethod
    def marcar_leidas(id_usuario):
        """Marca todas las notificaciones del usuario como leídas."""
        col = get_notificaciones()
        col.update_many(
            {'idReceptor': id_usuario, 'leida': False},
            {'$set': {'leida': True}}
        )

    @staticmethod
    def contar_no_leidas(id_usuario):
        col = get_notificaciones()
        return col.count_documents({'idReceptor': id_usuario, 'leida': False})