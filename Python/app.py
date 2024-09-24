from flask import Flask, jsonify
from flask_cors import CORS
from routes.index import index_bp
from routes.users import users_bp
from routes.images import images_bp
from routes.albums import albums_bp
from utils.db import get_db_connection

app = Flask(__name__)
CORS(app)

# Configuración del servidor
HOST = '0.0.0.0'
PORT = 5000

# Registro de Blueprints (rutas)
app.register_blueprint(index_bp, url_prefix='/')
app.register_blueprint(users_bp, url_prefix='/usuarios')
app.register_blueprint(images_bp, url_prefix='/imagenes')
app.register_blueprint(albums_bp, url_prefix='/albumes')

if __name__ == '__main__':
    connection = get_db_connection()
    if connection:
        app.run(host=HOST, port=PORT, debug=True)
        print('Servidor corriendo en http://{}:{}'.format(HOST, PORT))
    else:
        print('Error al conectar con la base de datos')