from flask import Blueprint, jsonify, request
import pymysql
import os
import boto3
import base64
from dotenv import load_dotenv
from utils.db import get_db_connection
from datetime import datetime

# Cargar las variables de entorno
load_dotenv()

images_bp = Blueprint('images', __name__)

# Configurar AWS S3
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

@images_bp.route('/', methods=['GET'])
def get_images():
    try:
        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM IMAGEN')
            rows = cursor.fetchall()

            imgs = [
                {
                    'id':           img['ID'],
                    'nombre':       img['NOMBRE'],
                    'descripcion':  img['DESCRIPCION'],
                    'imagen':       img['IMAGEN'],
                    'album':        img['ALBUM'],
                    'creacion':     img['CREACION']
                }
                for img in rows
            ]
        
        connection.close()
        return jsonify(imgs)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

@images_bp.route('/subir', methods=['POST'])
def upload():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        imagen = data.get('imagen')  # imagen en base64
        album = data.get('album')

        # Validación de campos obligatorios
        if not nombre or not imagen or not album:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400

        # Procesar la imagen en base64
        image_data = base64.b64decode(imagen.split(',')[1])  # Eliminar prefijo de base64 si es necesario

        # Parámetros para subir la imagen a S3
        s3_key = f"Fotos_Publicadas/{nombre}-{int(datetime.timestamp(datetime.now()))}.png"
        s3_client.put_object(
            Bucket=os.getenv('AWS_BUCKET_NAME'),
            Key=s3_key,
            Body=image_data,
            ContentType='image/png'
        )

        # URL de la imagen en S3
        image_url = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{s3_key}"

        # Conectar a la base de datos y guardar la información de la imagen
        connection = get_db_connection()
        with connection.cursor() as cursor:
            query = 'INSERT INTO IMAGEN (NOMBRE, DESCRIPCION, IMAGEN, ALBUM) VALUES (%s, %s, %s, %s)'
            cursor.execute(query, (nombre, descripcion, image_url, album))
            connection.commit()
            image_id = cursor.lastrowid

        connection.close()

        # Formatear respuesta
        image_data = {
            'id': image_id,
            'nombre': nombre,
            'descripcion': descripcion,
            'imagen': image_url,
            'album': album
        }

        return jsonify(image_data)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al subir la imagen'}), 500


@images_bp.route('/eliminar', methods=['DELETE'])
def delete():
    try:
        data = request.get_json()
        image_id = data.get('imagen')

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # Obtener la URL de la imagen
            cursor.execute('SELECT IMAGEN FROM IMAGEN WHERE ID = %s', (image_id,))
            row = cursor.fetchone()

            if not row:
                return jsonify({'error': 'Imagen no encontrada', 'message': 'Imagen no encontrada en la base de datos'}), 404

            image_url = row['IMAGEN']

            # Extraer el nombre del archivo de la URL de S3
            image_name = image_url.split('/')[-1]

            # Parámetros para eliminar la imagen de S3
            s3_client.delete_object(
                Bucket=os.getenv('AWS_BUCKET_NAME'),
                Key=f"Fotos_Publicadas/{image_name}"
            )

            # Eliminar la imagen de la base de datos
            cursor.execute('DELETE FROM IMAGEN WHERE ID = %s', (image_id,))
            connection.commit()

        connection.close()

        return jsonify({'message': 'Imagen eliminada exitosamente'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al eliminar la imagen'}), 500

