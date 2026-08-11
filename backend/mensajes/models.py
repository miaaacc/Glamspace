from django.db import models

# Create your models here.
# mensajes/models.py
from db.connection import get_collection
from datetime import datetime
import uuid

def get_mensajes():
    return get_collection('mensajes')

class Mensaje:

    @staticmethod
    def enviar(id_remitente, username_remitente, id_destinatario, contenido, tipo='texto',
               id_publicacion=None, titulo_publicacion='', foto_publicacion='', autor_publicacion=''):
        msgs = get_mensajes()
        if not contenido.strip() and tipo != 'publicacion':
            raise ValueError('El mensaje no puede estar vacío')

        msg = {
            'idMensaje': str(uuid.uuid4()),
            'idRemitente': id_remitente,
            'usernameRemitente': username_remitente,
            'idDestinatario': id_destinatario,
            'contenido': contenido.strip(),
            'tipo': tipo,
            'leido': False,
            'fecha': datetime.utcnow()
        }
        if tipo == 'publicacion':
            msg['idPublicacion'] = id_publicacion
            msg['tituloPublicacion'] = titulo_publicacion
            msg['fotoPublicacion'] = foto_publicacion
            msg['autorPublicacion'] = autor_publicacion
        msgs.insert_one(msg)
        msg['_id'] = str(msg['_id'])
        msg['fecha'] = msg['fecha'].isoformat()
        return msg

    @staticmethod
    def conversacion(id_a, id_b):
        """Todos los mensajes entre dos usuarios."""
        msgs = get_mensajes()
        cursor = msgs.find({
            '$or': [
                {'idRemitente': id_a, 'idDestinatario': id_b},
                {'idRemitente': id_b, 'idDestinatario': id_a},
            ]
        }).sort('fecha', 1)
        result = []
        for m in cursor:
            m['_id'] = str(m['_id'])
            m['fecha'] = m['fecha'].isoformat()
            result.append(m)
        return result

    @staticmethod
    def hilos(id_usuario):
        """Lista de personas con quienes ha hablado."""
        msgs = get_mensajes()
        cursor = msgs.find({
            '$or': [
                {'idRemitente': id_usuario},
                {'idDestinatario': id_usuario}
            ]
        }).sort('fecha', -1)

        vistos = {}
        for m in cursor:
            otro = m['idDestinatario'] if m['idRemitente'] == id_usuario else m['idRemitente']
            if otro not in vistos:
                m['_id'] = str(m['_id'])
                m['fecha'] = m['fecha'].isoformat()
                if m.get('tipo') == 'publicacion':
                    ultimo = '🔗 ' + (m.get('tituloPublicacion') or 'Publicación')
                else:
                    ultimo = m['contenido']
                vistos[otro] = {
                    'idOtro': otro,
                    'usernameOtro': m['usernameRemitente'] if m['idRemitente'] != id_usuario else 'usuario',
                    'ultimoMensaje': ultimo,
                    'fecha': m['fecha'],
                    'noLeidos': 0
                }
        return list(vistos.values())