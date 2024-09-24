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

# Create album
@albums_bp.route('/crear', methods=['POST'])
def create():
    try:
        data = request.get_json()
        usuario = data.get('usuario')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT COUNT(*) AS count FROM ALBUM WHERE USUARIO = %s', (usuario,))
            count = cursor.fetchone()['count']
            nombre = f"Mi album n°{count + 1}"

            # Insertar álbum en la base de datos
            cursor.execute('INSERT INTO ALBUM (NOMBRE, USUARIO) VALUES (%s, %s)', (nombre, usuario))
            connection.commit()

        connection.close()

        return jsonify({'message': 'Álbum creado', 'id': cursor.lastrowid, 'nombre': nombre, 'usuario': usuario})

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
def delete():
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        album = data.get('album')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # Insertar álbum en la base de datos
            cursor.execute('DELETE FROM ALBUM WHERE USUARIO = %s AND ID = %s', (usuario, album))
            connection.commit()

        connection.close()

        return jsonify({'message': 'Álbum eliminado'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al eliminar el álbum'}), 500    
