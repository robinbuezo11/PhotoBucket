from flask import Blueprint, jsonify, request
import pymysql
import os
import boto3
import requests
import base64
from dotenv import load_dotenv
from utils.db import get_db_connection
from utils.analyzeImage import analyze_image, extract_text
from utils.translateText import translate_text
from datetime import datetime

import re

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
        return jsonify({'error': str(e), 'message': 'Error al obtener las imágenes'}), 500

@images_bp.route('/perfil-images', methods=['GET'])
def get_perfil_images():
    try:
        nombre = request.args.get('nombre')
        if not nombre:
            return jsonify({'error': 'El parámetro "nombre" es obligatorio.'}), 400

        response = s3_client.list_objects_v2(
            Bucket=os.getenv('AWS_BUCKET_NAME'),
            Prefix='Fotos_Perfil/'
        )

        if 'Contents' not in response:
            return jsonify({'error': 'No se encontraron imágenes en la carpeta Fotos_Perfil.'}), 404

        filtered_images = []
        for obj in response['Contents']:
            file_name = obj['Key'].split('/')[-1] 
            if nombre.lower() in file_name.lower():  
                image_url = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{obj['Key']}"
                filtered_images.append(image_url)

        if not filtered_images:
            return jsonify({'message': f'No se encontraron imágenes con el nombre "{nombre}" en Fotos_Perfil.'}), 404

        return jsonify({'images': filtered_images})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al obtener las imágenes del bucket'}), 500


@images_bp.route('/<int:usuarioId>', methods=['GET'])
def get_images_by_usuario(usuarioId):
    try:
        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            query = """
                SELECT img.ID, img.NOMBRE, img.DESCRIPCION, img.IMAGEN, img.ALBUM, img.CREACION
                FROM IMAGEN img
                JOIN ALBUM alb ON img.ALBUM = alb.ID
                WHERE alb.USUARIO = %s
            """
            cursor.execute(query, (usuarioId,))
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
        return jsonify({'error': str(e), 'message': 'Error al obtener las imágenes'}), 500
    

@images_bp.route('/image/<int:imageId>', methods=['GET'])
def get_image_by_id(imageId):
    try:
        print(f"Obteniendo imagen con ID: {imageId}")
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT ID, NOMBRE, DESCRIPCION, IMAGEN, ALBUM, CREACION FROM IMAGEN WHERE ID = %s', (imageId,))
            image_row = cursor.fetchone()

            if not image_row:
                return jsonify({'message': 'Imagen no encontrada'}), 404
            
            album_id = image_row['ALBUM']
            cursor.execute('SELECT NOMBRE FROM ALBUM WHERE ID = %s', (album_id,))
            album_row = cursor.fetchone()

            if not album_row:
                return jsonify({'message': 'Álbum no encontrado'}), 404
            
            image_url = image_row['IMAGEN']
            response = requests.get(image_url)

            if response.status_code != 200:
                return jsonify({'message': 'No se pudo obtener la imagen desde la URL proporcionada'}), 500
            
            base64_image = base64.b64encode(response.content).decode('utf-8')
            labels = analyze_image(base64_image)

            img = {
                'id':           image_row['ID'],
                'nombre':       image_row['NOMBRE'],
                'descripcion':  image_row['DESCRIPCION'],
                'imagen':       image_row['IMAGEN'],
                'album':        album_row['NOMBRE'],
                'creacion':     image_row['CREACION'],
                'labels':       labels
            }

        connection.close()
        return jsonify(img)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error al obtener la imagen'}), 500
    

@images_bp.route('/subir', methods=['POST'])
def upload():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        imagen = data.get('imagen')
        album = data.get('album')

        if not nombre or not imagen or not album:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400
        
        image_data = base64.b64decode(re.sub(r'^data:image/\w+;base64,', '', imagen))

        s3_key = f"Fotos_Publicadas/{nombre}-{int(datetime.timestamp(datetime.now()))}.png"
        try:
            s3_client.put_object(
                Bucket=os.getenv('AWS_BUCKET_NAME'),
                Key=s3_key,
                Body=image_data,
                ContentType='image/png',
                ContentEncoding='base64'
            )
        except Exception as e:
            print(f"Error al subir la imagen a S3: {str(e)}")
            return jsonify({'error': str(e), 'message': 'Error al subir la imagen a S3'}), 500

        image_url = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{s3_key}"

        connection = get_db_connection()
        with connection.cursor() as cursor:
            query = 'INSERT INTO IMAGEN (NOMBRE, DESCRIPCION, IMAGEN, ALBUM) VALUES (%s, %s, %s, %s)'
            cursor.execute(query, (nombre, descripcion, image_url, album))
            connection.commit()
            image_id = cursor.lastrowid

        connection.close()

        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM IMAGEN WHERE ID = %s', (image_id,))
            image = cursor.fetchone()

        connection.close()

        image_data = {
            'id': image['ID'],
            'nombre': image['NOMBRE'],
            'descripcion': image['DESCRIPCION'],
            'imagen': image['IMAGEN'],
            'album': image['ALBUM'],
            'creacion': image['CREACION']
        }

        return jsonify(image_data)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

@images_bp.route('/eliminar', methods=['DELETE'])
def delete_image():
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


@images_bp.route('/analyzeImage', methods=['POST'])
def analyze_imageT():
    try:
        data = request.get_json()
        imagen = data.get('imagen')

        if not imagen:
            return jsonify({'message': 'Imagen no proporcionada'}), 400
        image_data = re.sub(r'^data:image/\w+;base64,', '', imagen)
        if not image_data:
            return jsonify({'message': 'Error al procesar la imagen'}), 400
        
        labels = extract_text(image_data)

        return jsonify({'labels': labels})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500
    

@images_bp.route('/translateText', methods=['POST'])
def translate_textR():
    try:
        data = request.get_json()
        text = data.get('text')
        target_lang = data.get('targetLanguage')

        if not text or not target_lang:
            return jsonify({'message': 'Faltan campos obligatorios'}), 400
        
        translated_text = translate_text(text, target_lang)

        return jsonify({'translatedText': translated_text})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500
    
    