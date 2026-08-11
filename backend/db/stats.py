# db/stats.py
from db.connection import get_collection

def get_estadisticas_generales():
    """Retorna métricas generales de la plataforma."""
    usuarios = get_collection('usuarios')
    publicaciones = get_collection('publicaciones')
    comentarios = get_collection('comentarios')
    reportes = get_collection('reportes')

    return {
        'totalUsuarios': usuarios.count_documents({}),
        'totalPublicaciones': publicaciones.count_documents({'estado': 'activo'}),
        'publicacionesReportadas': publicaciones.count_documents({'estado': 'reportado'}),
        'publicacionesEliminadas': publicaciones.count_documents({'estado': 'eliminado'}),
        'totalComentarios': comentarios.count_documents({}),
        'reportesPendientes': reportes.count_documents({'estado': 'pendiente'}),
    }