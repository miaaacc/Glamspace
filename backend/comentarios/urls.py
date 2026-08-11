# comentarios/urls.py
from django.urls import path
from comentarios import views

urlpatterns = [
    path('<str:id_publicacion>/', views.comentarios_publicacion, name='comentarios'),
    path('eliminar/<str:id_comentario>/', views.eliminar_comentario, name='eliminar-comentario'),
]