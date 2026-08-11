from django.db import models

# Create your models here.
# publicaciones/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_publicaciones():
    return get_collection('publicaciones')

class Publicacion:

    @staticmethod
    def crear(id_usuario, username, titulo, descripcion, id_categoria, fotos=[], videos=[]):
        """Crea una nueva publicación."""
        publicaciones = get_publicaciones()

        publicacion = {
            'idPublicacion': str(uuid.uuid4()),
            'idUsuario': id_usuario,
            'username': username,
            'titulo': titulo,
            'descripcion': descripcion,
            'estado': 'activo',
            'fechaPublicacion': datetime.utcnow(),
            'idCategoria': id_categoria,
            'fotos': fotos,    # lista de strings base64
            'videos': videos,  # lista de strings base64
            'totalReacciones': 0,
            'totalComentarios': 0
        }

        resultado = publicaciones.insert_one(publicacion)
        publicacion['_id'] = str(resultado.inserted_id)
        publicacion['fechaPublicacion'] = publicacion['fechaPublicacion'].isoformat()
        return publicacion

    @staticmethod
    def listar(id_categoria=None, pagina=1, limite=10, orden_tendencias=False):
        """Lista publicaciones activas, opcionalmente filtradas por categoría."""
        publicaciones = get_publicaciones()

        filtro = {'estado': 'activo'}
        if id_categoria:
            filtro['idCategoria'] = id_categoria

        saltar = (pagina - 1) * limite
        if orden_tendencias:
            # Solo publicaciones con más de un like, ordenadas por las que tienen más
            filtro['totalReacciones'] = {'$gte': 2}
            cursor = publicaciones.find(filtro).sort(
                [('totalReacciones', -1), ('totalComentarios', -1)]
            ).skip(saltar).limit(limite)
        else:
            cursor = publicaciones.find(filtro).sort(
                'fechaPublicacion', -1  # más recientes primero
            ).skip(saltar).limit(limite)

        resultado = []
        for pub in cursor:
            pub['_id'] = str(pub['_id'])
            pub['fechaPublicacion'] = pub['fechaPublicacion'].isoformat()
            resultado.append(pub)

        total = publicaciones.count_documents(filtro)
        return resultado, total

    @staticmethod
    def buscar_por_id(id_publicacion):
        """Busca una publicación por su idPublicacion."""
        publicaciones = get_publicaciones()
        pub = publicaciones.find_one({'idPublicacion': id_publicacion})
        if pub:
            pub['_id'] = str(pub['_id'])
            pub['fechaPublicacion'] = pub['fechaPublicacion'].isoformat()
        return pub

    @staticmethod
    def eliminar(id_publicacion, id_usuario):
        """
        Elimina (desactiva) una publicación.
        Solo el dueño o un admin puede hacerlo.
        """
        publicaciones = get_publicaciones()
        resultado = publicaciones.update_one(
            {'idPublicacion': id_publicacion, 'idUsuario': id_usuario},
            {'$set': {'estado': 'eliminado'}}
        )
        return resultado.modified_count > 0

    @staticmethod
    def eliminar_como_admin(id_publicacion):
        """Elimina cualquier publicación (solo admin/moderador)."""
        publicaciones = get_publicaciones()
        resultado = publicaciones.update_one(
            {'idPublicacion': id_publicacion},
            {'$set': {'estado': 'eliminado'}}
        )
        return resultado.modified_count > 0

    @staticmethod
    def listar_por_usuario(id_usuario):
        """Lista todas las publicaciones activas de un usuario."""
        publicaciones = get_publicaciones()
        cursor = publicaciones.find(
            {'idUsuario': id_usuario, 'estado': 'activo'}
        ).sort('fechaPublicacion', -1)

        resultado = []
        for pub in cursor:
            pub['_id'] = str(pub['_id'])
            pub['fechaPublicacion'] = pub['fechaPublicacion'].isoformat()
            resultado.append(pub)
        return resultado