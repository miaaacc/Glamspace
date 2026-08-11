from django.db import models

# Create your models here.
# reportes/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_reportes():
    return get_collection('reportes')

def get_publicaciones():
    return get_collection('publicaciones')

MOTIVOS = [
    'contenido_inapropiado',
    'spam',
    'acoso',
    'informacion_falsa',
    'otro'
]

class Reporte:

    @staticmethod
    def crear(id_publicacion, id_usuario, motivo, descripcion=''):
        """Crea un reporte sobre una publicación."""
        reportes = get_reportes()

        # Verificar que no haya reportado ya esta publicación
        existente = reportes.find_one({
            'idPublicacion': id_publicacion,
            'idUsuario': id_usuario
        })
        if existente:
            raise ValueError('Ya reportaste esta publicación')

        if motivo not in MOTIVOS:
            raise ValueError(f'Motivo inválido. Usa: {MOTIVOS}')

        reporte = {
            'idReporte': str(uuid.uuid4()),
            'idPublicacion': id_publicacion,
            'idUsuario': id_usuario,
            'motivo': motivo,
            'descripcion': descripcion,
            'estado': 'pendiente',  # pendiente | resuelto | descartado
            'fechaReporte': datetime.utcnow()
        }

        reportes.insert_one(reporte)

        # Marcar la publicación como reportada
        get_publicaciones().update_one(
            {'idPublicacion': id_publicacion},
            {'$set': {'estado': 'reportado'}}
        )

        reporte['_id'] = str(reporte['_id'])
        reporte['fechaReporte'] = reporte['fechaReporte'].isoformat()
        return reporte

    @staticmethod
    def listar(estado=None):
        """Lista reportes, opcionalmente filtrados por estado."""
        reportes = get_reportes()
        filtro = {}
        if estado:
            filtro['estado'] = estado

        cursor = reportes.find(filtro).sort('fechaReporte', -1)
        resultado = []
        for r in cursor:
            r['_id'] = str(r['_id'])
            r['fechaReporte'] = r['fechaReporte'].isoformat()
            resultado.append(r)
        return resultado

    @staticmethod
    def resolver(id_reporte, accion):
        """
        Resuelve un reporte.
        accion: 'resuelto' (eliminar contenido) | 'descartado' (ignorar)
        """
        reportes = get_reportes()

        reporte = reportes.find_one({'idReporte': id_reporte})
        if not reporte:
            raise ValueError('Reporte no encontrado')

        reportes.update_one(
            {'idReporte': id_reporte},
            {'$set': {'estado': accion}}
        )

        # Si se resuelve → eliminar la publicación
        if accion == 'resuelto':
            get_publicaciones().update_one(
                {'idPublicacion': reporte['idPublicacion']},
                {'$set': {'estado': 'eliminado'}}
            )

        # Si se descarta → restaurar la publicación a activo
        if accion == 'descartado':
            get_publicaciones().update_one(
                {'idPublicacion': reporte['idPublicacion']},
                {'$set': {'estado': 'activo'}}
            )

        return True

    @staticmethod
    def estadisticas():
        """Retorna estadísticas generales para el panel admin."""
        reportes = get_reportes()
        return {
            'pendientes': reportes.count_documents({'estado': 'pendiente'}),
            'resueltos': reportes.count_documents({'estado': 'resuelto'}),
            'descartados': reportes.count_documents({'estado': 'descartado'}),
        }