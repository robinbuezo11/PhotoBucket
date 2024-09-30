from flask import Blueprint, jsonify, request
import pymysql
import os
import boto3
from dotenv import load_dotenv
from utils.db import get_db_connection

# Cargar las variables de entorno
load_dotenv()

albums_bp = Blueprint('albums', __name__)

# Configurar AWS S3
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

@albums_bp.route('/', methods=['GET'])
def get_albums():
    try:
        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM ALBUM')
            rows = cursor.fetchall()

            albums = [
                {
                    'id':           album['ID'],
                    'nombre':       album['NOMBRE'],
                    'usuario':      album['USUARIO'],
                    'creacion':     album['CREACION']
                }
                for album in rows
            ]
        connection.close()
        return jsonify(albums)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al obtener los albumes'}), 500

@albums_bp.route('/<string:userId>', methods=['GET'])
def get_user_albums(userId):
    try:
        connection = get_db_connection()
        with connection.cursor(pymysql.cursor.DictCursor) as cursor:
            cursor.execute('SELECT * FROM ALBUM WHERE USUARIO = %s', (userId,))
            rows = cursor.fetchall()

            albums = [
                {
                    'id':           album['ID'],
                    'nombre':       album['NOMBRE'],
                    'usuario':      album['USUARIO'],
                    'creacion':     album['CREACION']
                }
                for album in rows
            ]
        connection.close()
        return jsonify(albums)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al obtener los álbumes'}), 500

# Create album
@albums_bp.route('/crear', methods=['POST'])
def create_album():
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        nombre_album = data.get('nombreAlbum')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT COUNT(*) AS count FROM ALBUM WHERE USUARIO = %s AND NOMBRE = %s', (usuario, nombre_album))
            count = cursor.fetchone()['count']
            if count > 0:
                return jsonify({'message': 'El nombre del álbum ya está en uso.'}), 400

            # Insertar álbum en la base de datos
            cursor.execute('INSERT INTO ALBUM (NOMBRE, USUARIO) VALUES (%s, %s)', (nombre_album, usuario))
            connection.commit()

        connection.close()

        return jsonify({'message': 'Álbum creado', 'id': cursor.lastrowid, 'nombre': nombre_album, 'usuario': usuario})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al crear el álbum'}), 500

# Update album
@albums_bp.route('/actualizar', methods=['POST'])
def update():
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        album = data.get('album')
        nombre = data.get('nombre')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # Insertar álbum en la base de datos
            cursor.execute('UPDATE ALBUM SET NOMBRE = %s WHERE USUARIO = %s AND ID = %s', (nombre, usuario, album))
            connection.commit()

        connection.close()

        return jsonify({'message': 'Álbum actualizado'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al actualizar el álbum'}), 500

# Delete album
@albums_bp.route('/eliminar', methods=['POST'])
def delete_album():
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        album = data.get('album')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # Obtener imágenes del álbum antes de eliminar
            cursor.execute('SELECT IMAGEN FROM IMAGEN WHERE ALBUM = %s', (album,))
            images = cursor.fetchall()

            # Eliminar el álbum de la base de datos
            cursor.execute('DELETE FROM ALBUM WHERE USUARIO = %s AND ID = %s', (usuario, album))
            connection.commit()

        # Eliminar imágenes de S3
        if images:
            for img in images:
                image_url = img['IMAGEN']
                image_name = image_url.split('/').pop()
                # Eliminar objeto de S3
                s3_client.delete_object(
                    Bucket=os.getenv('AWS_BUCKET_NAME'),  # Usar variable de entorno para el nombre del bucket
                    Key=f'Fotos_Publicadas/{image_name}'
                )

        connection.close()

        return jsonify({'message': 'Álbum e imágenes eliminadas exitosamente'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al eliminar el álbum y sus imágenes'}), 500
