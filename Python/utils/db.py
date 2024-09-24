# db.py
import pymysql
import os
from dotenv import load_dotenv

# Cargar las variables de entorno
load_dotenv()

# Verificar conexión a la base de datos
def get_db_connection():
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            database=os.getenv('DB_NAME')
        )
        return connection
    except Exception as e:
        return None
