# favoritos/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_favoritos():
    return get_collection('favoritos')

class Favorito:

    @staticmethod
    def toggle(id_usuario, id_publicacion):
        """
        Si ya existe el favorito → lo elimina (toggle off).
        Si no existe → lo crea (toggle on).
        Retorna True si quedó guardado, False si se eliminó.
        """
        col = get_favoritos()
        existente = col.find_one({
            'idUsuario': id_usuario,
            'idPublicacion': id_publicacion
        })
        if existente:
            col.delete_one({'_id': existente['_id']})
            return False
        else:
            col.insert_one({
                'idFavorito': str(uuid.uuid4()),
                'idUsuario': id_usuario,
                'idPublicacion': id_publicacion,
                'fecha': datetime.utcnow()
            })
            return True

    @staticmethod
    def es_favorito(id_usuario, id_publicacion):
        """Verifica si una publicación está en favoritos del usuario."""
        col = get_favoritos()
        return col.find_one({
            'idUsuario': id_usuario,
            'idPublicacion': id_publicacion
        }) is not None

    @staticmethod
    def listar_de_usuario(id_usuario):
        """Retorna los idPublicacion que el usuario tiene en favoritos."""
        col = get_favoritos()
        cursor = col.find({'idUsuario': id_usuario}).sort('fecha', -1)
        return [f['idPublicacion'] for f in cursor]

    @staticmethod
    def ids_favoritos(id_usuario, lista_ids):
        """
        Dado el usuario y una lista de idPublicacion,
        retorna cuáles están en favoritos. Útil para marcar el feed.
        """
        col = get_favoritos()
        cursor = col.find({
            'idUsuario': id_usuario,
            'idPublicacion': {'$in': lista_ids}
        })
        return {f['idPublicacion'] for f in cursor}