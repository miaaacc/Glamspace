from django.db import models

# Create your models here.
# categorias/models.py
from db.connection import get_collection
import uuid

def get_categorias():
    return get_collection('categorias')

class Categoria:

    @staticmethod
    def inicializar_categorias():
        """
        Crea las categorías base si no existen.
        Llámalo una sola vez desde la terminal.
        """
        categorias = get_categorias()

        if categorias.count_documents({}) > 0:
            return 'Las categorías ya existen'

        categorias_base = [
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Maquillaje',     'descripcion': 'Tutoriales y tips de maquillaje'},
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Skincare',       'descripcion': 'Rutinas y cuidado de la piel'},
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Cabello',        'descripcion': 'Peinados, tratamientos y cortes'},
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Tendencias',     'descripcion': 'Lo más nuevo en belleza'},
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Uñas',           'descripcion': 'Nail art y cuidado de uñas'},
            {'idCategoria': str(uuid.uuid4()), 'nombreCategoria': 'Bienestar',      'descripcion': 'Salud y cuidado personal'},
        ]

        categorias.insert_many(categorias_base)
        return f'{len(categorias_base)} categorías creadas'

    @staticmethod
    def listar():
        """Lista todas las categorías."""
        categorias = get_categorias()
        resultado = []
        for cat in categorias.find():
            cat['_id'] = str(cat['_id'])
            resultado.append(cat)
        return resultado