from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# En producción siempre definir SECRET_KEY en el .env
SECRET_KEY = os.getenv('SECRET_KEY', 'clave-de-desarrollo')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', '*').split(',') if h.strip()]

# Apps instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Librerías
    'rest_framework',
    'corsheaders',
    # Nuestras apps
    'usuarios',
    'publicaciones',
    'comentarios',
    'reacciones',
    'categorias',
    'reportes',
    'mensajes',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe ir primero
    'utils.middleware.LimitarTamanoBodyMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Usamos MongoDB directamente con pymongo (sin ORM de Django)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Conexión a MongoDB
MONGO_URL = os.getenv('MONGO_URL')
MONGO_DB_NAME = 'ProyectoMia'

# CORS: origenes permitidos (lista separada por coma en la env CORS_ALLOWED_ORIGINS).
# En producción incluye el dominio de Vercel, ej: https://glamspace.vercel.app
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
    ).split(',') if o.strip()
]

CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)

# ── Encabezados de seguridad ─────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'
CSRF_COOKIE_HTTPONLY = True

# Límites de subida (imágenes base64 de hasta 10 MB, 4 por publicación).
# DATA_UPLOAD_MAX_MEMORY_SIZE es el límite real del body JSON en memoria;
# hay que subirlo junto con el middleware para no rechazar peticiones grandes.
DATA_UPLOAD_MAX_MEMORY_SIZE = 64 * 1024 * 1024

if not DEBUG:
    # Solo forzar HTTPS cuando no estamos en desarrollo local
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Costa_Rica'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'