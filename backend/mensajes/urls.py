# mensajes/urls.py
from django.urls import path
from mensajes import views

urlpatterns = [
    path('compartir/', views.compartir_publicacion, name='compartir-publicacion'),
    path('', views.hilos_mensajes, name='hilos'),
    path('<str:id_otro>/', views.mensajes_conversacion, name='conversacion'),
]