# reacciones/urls.py
from django.urls import path
from reacciones import views

urlpatterns = [
    path('<str:id_publicacion>/', views.togglear_reaccion, name='reaccion-toggle'),
    path('<str:id_publicacion>/info/', views.info_reacciones, name='reaccion-info'),
]