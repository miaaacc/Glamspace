# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('usuarios.urls')),
    path('api/publicaciones/', include('publicaciones.urls')),
    path('api/categorias/', include('categorias.urls')),
    path('api/comentarios/', include('comentarios.urls')),
    path('api/reacciones/', include('reacciones.urls')),
    path('api/reportes/', include('reportes.urls')),
    path('api/mensajes/', include('mensajes.urls')),
    path('api/favoritos/', include('favoritos.urls')),
    path('api/notificaciones/', include('notificaciones.urls')),
]