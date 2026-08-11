# usuarios/urls.py
from django.urls import path
from usuarios import views

urlpatterns = [
    # Auth
    path('registro/', views.registro, name='registro'),
    path('login/', views.login, name='login'),
    path('perfil/', views.perfil_propio, name='perfil-propio'),

    # Recuperar contraseña
    path('recuperar/solicitar/', views.solicitar_recuperacion, name='recuperar-solicitar'),
    path('recuperar/cambiar/', views.cambiar_password, name='recuperar-cambiar'),

    # Perfil público
    path('buscar/', views.buscar_usuarios, name='buscar-usuarios'),
    path('<str:id_usuario>/', views.ver_perfil, name='ver-perfil'),
    path('<str:id_usuario>/seguir/', views.seguir_usuario, name='seguir'),
    path('<str:id_usuario>/seguidores/', views.seguidores_usuario, name='seguidores'),
    path('<str:id_usuario>/siguiendo/', views.siguiendo_usuario, name='siguiendo'),

    # Editar perfil propio
    path('editar/perfil/', views.editar_perfil, name='editar-perfil'),
]