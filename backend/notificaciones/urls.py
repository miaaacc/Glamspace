# notificaciones/urls.py
from django.urls import path
from notificaciones import views

urlpatterns = [
    path('', views.listar_notificaciones, name='notificaciones'),
    path('leer/', views.marcar_leidas, name='marcar-leidas'),
    path('count/', views.contar_no_leidas, name='contar-no-leidas'),
]