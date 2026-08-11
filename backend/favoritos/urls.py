# favoritos/urls.py
from django.urls import path
from favoritos import views

urlpatterns = [
    path('', views.mis_favoritos, name='mis-favoritos'),
    path('<str:id_publicacion>/toggle/', views.toggle_favorito, name='toggle-favorito'),
    path('<str:id_publicacion>/estado/', views.estado_favorito, name='estado-favorito'),
]