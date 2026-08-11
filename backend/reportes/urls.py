# reportes/urls.py
from django.urls import path
from reportes import views

urlpatterns = [
    # Reportar publicación (cualquier usuario autenticado)
    path('publicacion/<str:id_publicacion>/', views.crear_reporte, name='crear-reporte'),
    path('motivos/', views.motivos_reporte, name='motivos'),

    # Panel admin
    path('admin/estadisticas/', views.panel_estadisticas, name='estadisticas'),
    path('admin/reportes/', views.listar_reportes, name='listar-reportes'),
    path('admin/reportes/<str:id_reporte>/', views.resolver_reporte, name='resolver-reporte'),
    path('admin/usuarios/', views.listar_usuarios_admin, name='usuarios-admin'),
    path('admin/usuarios/<str:id_usuario>/rol/', views.cambiar_rol, name='cambiar-rol'),
]