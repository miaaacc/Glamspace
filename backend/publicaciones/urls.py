# publicaciones/urls.py
from django.urls import path
from publicaciones import views

urlpatterns = [
    path('', views.publicaciones, name='publicaciones'),
    path('<str:id_publicacion>/', views.publicacion_detalle, name='publicacion-detalle'),
    path('usuario/<str:id_usuario>/', views.publicaciones_usuario, name='publicaciones-usuario'),
]