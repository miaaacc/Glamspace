# categorias/urls.py
from django.urls import path
from publicaciones.views import categorias_lista

urlpatterns = [
    path('', categorias_lista, name='categorias'),
]