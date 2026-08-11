from django.db import models

# Create your models here.
# reacciones/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_reacciones():
    return get_collection('reacciones')

def get_publicaciones():
    return get_collection('publicaciones')

# Tipos de reacción permitidos
TIPOS_REACCION = ['❤️', '😍', '👏', '✨', '😮']

class Reaccion:

    @staticmethod
    def togglear(id_publicacion, id_usuario, tipo_reaccion):
        """
        Si el usuario ya reaccionó con ese tipo → elimina la reacción (toggle).
        Si no ha reaccionado con ese tipo → la crea.
        Retorna el estado final y el total actualizado.
        """
        if tipo_reaccion not in TIPOS_REACCION:
            raise ValueError(f'Tipo de reacción inválido. Usa: {TIPOS_REACCION}')

        reacciones = get_reacciones()
        publicaciones = get_publicaciones()

        # Buscar si ya existe esta reacción exacta
        existente = reacciones.find_one({
            'idPublicacion': id_publicacion,
            'idUsuario': id_usuario,
            'tipoReaccion': tipo_reaccion
        })

        if existente:
            # Ya reaccionó → quitar la reacción
            reacciones.delete_one({'_id': existente['_id']})
            publicaciones.update_one(
                {'idPublicacion': id_publicacion},
                {'$inc': {'totalReacciones': -1}}
            )
            accion = 'eliminada'
        else:
            # No había reaccionado con este tipo → agregar
            reacciones.insert_one({
                'idReaccion': str(uuid.uuid4()),
                'idPublicacion': id_publicacion,
                'idUsuario': id_usuario,
                'tipoReaccion': tipo_reaccion,
                'fechaReaccion': datetime.utcnow()
            })
            publicaciones.update_one(
                {'idPublicacion': id_publicacion},
                {'$inc': {'totalReacciones': 1}}
            )
            accion = 'agregada'

        # Obtener totales actualizados por tipo
        totales = Reaccion.contar_por_tipo(id_publicacion)
        return accion, totales

    @staticmethod
    def contar_por_tipo(id_publicacion):
        """Retorna un diccionario con el conteo de cada tipo de reacción."""
        reacciones = get_reacciones()
        totales = {tipo: 0 for tipo in TIPOS_REACCION}

        cursor = reacciones.find({'idPublicacion': id_publicacion})
        for r in cursor:
            tipo = r['tipoReaccion']
            if tipo in totales:
                totales[tipo] += 1

        return totales

    @staticmethod
    def reacciones_del_usuario(id_publicacion, id_usuario):
        """Retorna qué tipos de reacción puso este usuario en esta publicación."""
        reacciones = get_reacciones()
        cursor = reacciones.find({
            'idPublicacion': id_publicacion,
            'idUsuario': id_usuario
        })
        return [r['tipoReaccion'] for r in cursor]