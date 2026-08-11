from django.db import models

# Create your models here.
# comentarios/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_comentarios():
    return get_collection('comentarios')

def get_publicaciones():
    return get_collection('publicaciones')

class Comentario:

    @staticmethod
    def crear(id_publicacion, id_usuario, username, contenido):
        """Crea un comentario y actualiza el contador de la publicación."""
        comentarios = get_comentarios()
        publicaciones = get_publicaciones()

        comentario = {
            'idComentario': str(uuid.uuid4()),
            'idPublicacion': id_publicacion,
            'idUsuario': id_usuario,
            'username': username,
            'contenido': contenido,
            'fechaComentario': datetime.utcnow()
        }

        comentarios.insert_one(comentario)

        # Incrementar el contador en la publicación
        publicaciones.update_one(
            {'idPublicacion': id_publicacion},
            {'$inc': {'totalComentarios': 1}}
        )

        comentario['_id'] = str(comentario['_id'])
        comentario['fechaComentario'] = comentario['fechaComentario'].isoformat()
        return comentario

    @staticmethod
    def listar_por_publicacion(id_publicacion):
        """Lista todos los comentarios de una publicación."""
        comentarios = get_comentarios()
        cursor = comentarios.find(
            {'idPublicacion': id_publicacion}
        ).sort('fechaComentario', 1)  # más antiguos primero

        resultado = []
        for com in cursor:
            com['_id'] = str(com['_id'])
            com['fechaComentario'] = com['fechaComentario'].isoformat()
            resultado.append(com)

        # Añadir la foto de perfil de cada autor (una sola consulta por lote)
        ids = list({com['idUsuario'] for com in resultado})
        if ids:
            usuarios = get_collection('usuarios')
            fotos = {
                u['idUsuario']: u.get('fotoPerfil', '')
                for u in usuarios.find(
                    {'idUsuario': {'$in': ids}},
                    {'idUsuario': 1, 'fotoPerfil': 1}
                )
            }
            for com in resultado:
                com['fotoPerfil'] = fotos.get(com['idUsuario'], '')

        return resultado

    @staticmethod
    def eliminar(id_comentario, id_usuario):
        """Elimina un comentario y actualiza el contador."""
        comentarios = get_comentarios()
        publicaciones = get_publicaciones()

        # Buscar el comentario primero para saber a qué publicación pertenece
        comentario = comentarios.find_one({'idComentario': id_comentario})
        if not comentario:
            return False

        # Solo el dueño puede eliminar
        if comentario['idUsuario'] != id_usuario:
            return False

        comentarios.delete_one({'idComentario': id_comentario})

        # Decrementar el contador
        publicaciones.update_one(
            {'idPublicacion': comentario['idPublicacion']},
            {'$inc': {'totalComentarios': -1}}
        )
        return True