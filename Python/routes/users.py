from flask import Blueprint, jsonify, request
import pymysql
import os
import bcrypt
import boto3
import base64
from dotenv import load_dotenv
from utils.db import get_db_connection
from datetime import datetime
import re
from utils.compareImages import compare_images
from utils.analyzeImage import analyze_image

# Cargar las variables de entorno
load_dotenv()

users_bp = Blueprint('users', __name__)

# Configurar AWS S3
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

# Get all users
@users_bp.route('/', methods=['GET'])
def get_users():
    try:
        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM USUARIO')
            rows = cursor.fetchall()

            users = [
                {
                    'id':           user['ID'],
                    'usuario':      user['USUARIO'],
                    'correo':       user['CORREO'],
                    'imagen':       user['IMAGEN'],
                    'recactivo':    user['RECACTIVO'],
                    'recimagen':    user['RECIMAGEN'],
                    'creacion':     user['CREACION']
                }
                for user in rows
            ]
        
        connection.close()
        return jsonify(users)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

# Login
@users_bp.route('/login', methods=['POST'])
def login():
    try:
        data     = request.get_json()
        usuario  = data.get('usuario')
        password = data.get('password')

        # Validar campos obligatorios
        if not usuario or not password:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400

        # Validar si el usuario es admin
        if usuario == 'admin' and password == 'admin':
            return jsonify({
                'id':            1,
                'usuario':      'admin',
                'correo':       'admin@example.com',
                'imagen':       'url_to_admin_image',
                'recactivo':    True,
                'recimagen':    'url_to_admin_image',
                'creacion':     datetime.now().isoformat()
            })

        # Conectar a la base de datos
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM USUARIO WHERE USUARIO = %s OR CORREO = %s', (usuario, usuario))
            rows = cursor.fetchall()

            # Verificar si el usuario existe
            if len(rows) == 0:
                return jsonify({'error': 'Usuario no encontrado', 'message': 'Usuario no encontrado'}), 401

            user = rows[0]

            # Verificar si la contraseña es correcta
            if not bcrypt.checkpw(password.encode('utf-8'), user['CONTRASENA'].encode('utf-8')):
                return jsonify({'error': 'Contraseña incorrecta', 'message': 'Contraseña incorrecta'}), 401

            # Formatear los datos del usuario
            user_data = {
                'id':           user['ID'],
                'usuario':      user['USUARIO'],
                'correo':       user['CORREO'],
                'imagen':       user['IMAGEN'],
                'recactivo':    user['RECACTIVO'],
                'recimagen':    user['RECIMAGEN'],
                'creacion':     user['CREACION']
            }

        connection.close()
        return jsonify(user_data)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

# Register
@users_bp.route('/registrar', methods=['POST'])
def register():
    try:
        data     = request.get_json()
        usuario  = data.get('usuario')
        correo   = data.get('correo')
        password = data.get('password')
        imagen   = data.get('imagen')

        # Validar campos obligatorios
        if not usuario or not correo or not password or not imagen:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400

        # Validar si el usuario ya existe
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT ID FROM USUARIO WHERE USUARIO = %s OR CORREO = %s', (usuario, correo))
            rows = cursor.fetchall()

            if len(rows) > 0:
                return jsonify({'error': 'El usuario ya existe', 'message': 'El usuario ya existe'}), 409

            # Subir imagen a S3
            image_buffer = base64.b64decode(imagen.split(',')[1])
            s3_params = {
                'Bucket': os.getenv('AWS_BUCKET_NAME'),
                'Key': f'Fotos_Perfil/{usuario}-{int(datetime.now().timestamp())}.png',
                'Body': image_buffer,
                'ContentEncoding': 'base64',
                'ContentType': 'image/png'
            }
            s3_data = s3_client.put_object(**s3_params)
            image_url = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{s3_params['Key']}"

            # Hash de la contraseña
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            # Insertar usuario en la base de datos
            query = 'INSERT INTO USUARIO (USUARIO, CORREO, CONTRASENA, IMAGEN) VALUES (%s, %s, %s, %s)'
            cursor.execute(query, (usuario, correo, hashed_password.decode('utf-8'), image_url))
            connection.commit()
            user_id = cursor.lastrowid

            # Obtener los detalles del usuario registrado
            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (user_id,))
            user = cursor.fetchone()
            
            user_data = {
                'id':           user['ID'],
                'usuario':      user['USUARIO'],
                'correo':       user['CORREO'],
                'imagen':       user['IMAGEN'],
                'recactivo':    user['RECACTIVO'],
                'recimagen':    user['RECIMAGEN'],
                'creacion':     user['CREACION']
            }

        connection.close()
        return jsonify(user_data)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

# Update user
@users_bp.route('/actualizar', methods=['PUT'])
def update():
    try:
        data = request.get_json()
        id = data.get('id')
        usuario = data.get('usuario')
        correo = data.get('correo')
        password = data.get('password')
        imagen = data.get('imagen')
        recactivo = data.get('recactivo')
        recimagen = data.get('recimagen')
        confirma_password = data.get('confirma_password')

        # Validar campos obligatorios
        if not id or not usuario or not correo or not confirma_password:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400

        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (id,))
            rows = cursor.fetchall()

            if len(rows) == 0:
                return jsonify({'error': 'Usuario no encontrado', 'message': 'Usuario no encontrado'}), 404

            user = rows[0]

            # Verificar si la contraseña es correcta
            if not bcrypt.checkpw(confirma_password.encode('utf-8'), user['CONTRASENA'].encode('utf-8')):
                return jsonify({'error': 'Contraseña incorrecta', 'message': 'Contraseña incorrecta'}), 401

            # Validar si el nuevo usuario ya existe
            cursor.execute('SELECT ID FROM USUARIO WHERE (USUARIO = %s OR CORREO = %s) AND ID != %s', (usuario, correo, id))
            rows = cursor.fetchall()
            if len(rows) > 0:
                return jsonify({'error': 'El usuario ya existe', 'message': 'El usuario ya existe'}), 409

            # Subir nueva imagen de reconocimiento facial a S3
            old_recimagen = user['RECIMAGEN']
            new_recimagen = old_recimagen
            if recimagen:
                if recactivo is False or recactivo == 0:
                    return jsonify({'error': 'Debe activar el reconocimiento facial', 'message': 'Debe activar el reconocimiento facial para subir una imagen'}), 400
                
                if old_recimagen and old_recimagen != 'null':
                    key = old_recimagen.split('.com/')[1]
                    s3_client.delete_object(Bucket=os.getenv('AWS_BUCKET_NAME'), Key=key)
                
                recimage_buffer = base64.b64decode(recimagen.split(',')[1])
                recimage_params = {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Key': f'Fotos_Reconocimiento_Facial/{usuario}-{int(datetime.now().timestamp())}.png',
                    'Body': recimage_buffer,
                    'ContentEncoding': 'base64',
                    'ContentType': 'image/png'
                }
                s3_client.put_object(**recimage_params)
                new_recimagen = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{recimage_params['Key']}"
            elif recactivo is True or recactivo == 1:
                return jsonify({'error': 'Debe subir una imagen para activar el reconocimiento facial', 'message': 'Debe subir una imagen para activar el reconocimiento facial'}), 400

            # Subir nueva imagen de perfil a S3
            old_imagen = user['IMAGEN']
            new_imagen = old_imagen
            if imagen:
                if old_imagen and old_imagen != 'null':
                    key = old_imagen.split('.com/')[1]
                    s3_client.delete_object(Bucket=os.getenv('AWS_BUCKET_NAME'), Key=key)
                
                image_buffer = base64.b64decode(imagen.split(',')[1])
                image_params = {
                    'Bucket': os.getenv('AWS_BUCKET_NAME'),
                    'Key': f'Fotos_Perfil/{usuario}-{int(datetime.now().timestamp())}.png',
                    'Body': image_buffer,
                    'ContentEncoding': 'base64',
                    'ContentType': 'image/png'
                }
                s3_client.put_object(**image_params)
                new_imagen = f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{image_params['Key']}"

            # Hash de la contraseña
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()) if password else user['CONTRASENA']

            # Asegúrate de que recactivo no sea None
            if recactivo is None:
                recactivo = user['RECACTIVO']  # Mantén el valor actual si no se proporciona uno nuevo

            # Actualizar usuario en la base de datos
            query = 'UPDATE USUARIO SET USUARIO = %s, CORREO = %s, CONTRASENA = %s, IMAGEN = %s, RECACTIVO = %s, RECIMAGEN = %s WHERE ID = %s'
            cursor.execute(query, (usuario, correo, hashed_password, new_imagen, recactivo, new_recimagen, id))
            connection.commit()

            # Obtener los detalles del usuario actualizado
            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (id,))
            user = cursor.fetchone()

            user_data = {
                'id':           user['ID'],
                'usuario':      user['USUARIO'],
                'correo':       user['CORREO'],
                'imagen':       user['IMAGEN'],
                'recactivo':    user['RECACTIVO'],
                'recimagen':    user['RECIMAGEN'],
                'creacion':     user['CREACION']
            }

        connection.close()
        return jsonify(user_data)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

# Delete user
@users_bp.route('/eliminar', methods=['DELETE'])
def delete_user():
    try:
        data = request.get_json()
        id = data.get('id')
        password = data.get('password')

        # Validar campos obligatorios
        if not id or not password:
            return jsonify({'error': 'Faltan campos obligatorios', 'message': 'Faltan campos obligatorios'}), 400

        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (id,))
            rows = cursor.fetchall()

            if len(rows) == 0:
                return jsonify({'error': 'Usuario no encontrado', 'message': 'Usuario no encontrado'}), 404

            user = rows[0]

            # Verificar si la contraseña es correcta
            if not bcrypt.checkpw(password.encode('utf-8'), user['CONTRASENA'].encode('utf-8')):
                return jsonify({'error': 'Contraseña incorrecta', 'message': 'Contraseña incorrecta'}), 401

            # Eliminar la imagen de perfil de S3
            imagen = user['IMAGEN']
            if imagen and imagen != 'null':
                key = imagen.split('.com/')[1]
                s3_client.delete_object(Bucket=os.getenv('AWS_BUCKET_NAME'), Key=key)

            # Eliminar la imagen de reconocimiento facial de S3
            recimagen = user['RECIMAGEN']
            if recimagen and recimagen != 'null':
                key = recimagen.split('.com/')[1]
                s3_client.delete_object(Bucket=os.getenv('AWS_BUCKET_NAME'), Key=key)

            # Eliminar usuario de la base de datos
            cursor.execute('DELETE FROM USUARIO WHERE ID = %s', (id,))
            connection.commit()

        connection.close()
        return jsonify({'message': 'Usuario eliminado'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Error en el servidor'}), 500

@users_bp.route('/loginCamera', methods=['POST'])
def login_camera():
    try:
        data = request.json
        picture = data.get('picture')
        
        if not picture:
            return jsonify({'message': 'La imagen es requerida.'}), 400
        
        temp_file_name = f'temp_{int(datetime.timestamp(datetime.now()))}'
        captured_image_url = upload_image_to_s3(picture, temp_file_name)
        
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT ID, USUARIO, RECIMAGEN FROM USUARIO WHERE RECIMAGEN IS NOT NULL AND RECACTIVO = 1')
            user_rows = cursor.fetchall()
            
            if not user_rows:
                return jsonify({'message': 'No hay usuarios registrados'}), 404
            
            usuario_reconocido = None
            similitud_reconocida = None
            
            for user in user_rows:
                result = compare_images(captured_image_url, user['RECIMAGEN'])
                if result and isinstance(result, list) and len(result) > 0 and result[0]['Similarity' > 80]:
                    usuario_reconocido = user['ID']
                    similitud_reconocida = result[0]['Similarity']
                    break
                
            if usuario_reconocido:
                cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (usuario_reconocido,))
                user_data = cursor.fetchone()
                return jsonify({
                    'id': user_data['ID'],
                    'usuario': user_data['USUARIO'],
                    'correo': user_data['CORREO'],
                    'imagen': user_data['IMAGEN'],
                    'recactivo': user_data['RECACTIVO'],
                    'recimagen': user_data['RECIMAGEN'],
                    'creacion': user_data['CREACION']
                }), 200
                
            return jsonify({'message': 'Usuario no reconocido'}), 200
    except Exception as e:
        print('Error en el reconocimiento facial:', e)
        return jsonify({'message': 'Error en el reconocimiento facial', 'error': str(e)}), 500
    
# upload image to s3
def upload_image_to_s3(base64_image, user_id):
    recimage_buffer = base64.b64decode(re.sub(r'^data:image\/\w+;base64,', '', base64_image))
    params = {
        'Bucket': os.getenv('AWS_BUCKET_NAME'),
        'Key': f'Fotos_Reconocimiento_Facial/{user_id}-{int(datetime.now().timestamp())}.png',
        'Body': recimage_buffer,
        'ContentEncoding': 'base64',
        'ContentType': 'image/png'
    }
    
    try:
        s3_client.put_object(**params)
        return f"https://{os.getenv('AWS_BUCKET_NAME')}.s3.amazonaws.com/{params['Key']}"
    except Exception as e:
        print(f"Error al subir la imagen a S3: {str(e)}")
        raise Exception('Error al subir la imagen a S3')

@users_bp.route('/faceId', methods=['POST'])
def face_id():
    try:
        data = request.json
        id = data.get('id')
        recimagen = data.get('recimagen')
        recactivo = data.get('recactivo')
        confirma_password = data.get('confirma_password')
        
        connection = get_db_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (id,))
            rows = cursor.fetchall()
            
            if not rows:
                return jsonify({'error': 'Usuario no encontrado', 'message': 'Usuario no encontrado'}), 404
            
            user = rows[0]
            match = bcrypt.checkpw(confirma_password.encode('utf-8'), user['CONTRASENA'].encode('utf-8'))

            if not match:
                return jsonify({'error': 'Contraseña incorrecta', 'message': 'Contraseña incorrecta'}), 401

            new_rec_imagen = None
            reconocimiento = 1 if recactivo else 0

            if recimagen:
                if not recactivo:
                    return jsonify({'error': 'Debe activar el reconocimiento facial', 'message': 'Debe activar el reconocimiento facial para subir una imagen'}), 400

                new_rec_imagen = upload_image_to_s3(recimagen, user['USUARIO'])

            elif recactivo:
                return jsonify({'error': 'Debe subir una imagen para activar el reconocimiento facial', 'message': 'Debe subir una imagen para activar el reconocimiento facial'}), 400

            query = 'UPDATE USUARIO SET RECACTIVO = %s, RECIMAGEN = %s WHERE ID = %s'
            cursor.execute(query, (reconocimiento, new_rec_imagen, id))
            connection.commit()

            cursor.execute('SELECT * FROM USUARIO WHERE ID = %s', (id,))
            updated_user = cursor.fetchall()[0]

            user_data = {
                'id': updated_user['ID'],
                'usuario': updated_user['USUARIO'],
                'correo': updated_user['CORREO'],
                'imagen': updated_user['IMAGEN'],
                'recactivo': updated_user['RECACTIVO'],
                'recimagen': updated_user['RECIMAGEN'],
                'creacion': updated_user['CREACION']
            }
            return jsonify(user_data)

    except Exception as err:
        print(err)
        return jsonify({'error': str(err), 'message': 'Error en el servidor'}), 500