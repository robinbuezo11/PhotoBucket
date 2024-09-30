const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const express = require('express');
const router = express.Router();
const db = require('../utils/db');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ALBUM;');
        const albums = rows.map (album => {
            return {
                id:             album.ID,
                nombre:         album.NOMBRE,
                usuario:        album.USUARIO,
                creacion:       album.CREACION
            }
        });
        res.json(albums);
    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al obtener las imagenes' });
    }
    console.log('GET /imagenes');
});

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await db.query('SELECT * FROM ALBUM WHERE USUARIO = ?;', [userId]);
        const albums = rows.map(album => {
            return {
                id: album.ID,
                nombre: album.NOMBRE,
                usuario: album.USUARIO,
                creacion: album.CREACION
            };
        });
        res.json(albums);
    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al obtener los álbumes' });
    }
    console.log(`GET /albums/${userId}`);
});

router.post('/crear', async (req, res) => {
    try {
        const { usuario, nombreAlbum } = req.body;
        let [rows] = await db.query('SELECT COUNT(*) AS count FROM ALBUM WHERE USUARIO = ? AND NOMBRE = ?;', [usuario, nombreAlbum]);
        if (rows[0].count > 0) {
            return res.status(400).json({ message: 'El nombre del álbum ya está en uso.' });
        }
        const [result] = await db.query('INSERT INTO ALBUM (NOMBRE, USUARIO) VALUES (?, ?);', [nombreAlbum, usuario]);
        res.json({ message: 'Álbum creado', id: result.insertId, nombre: nombreAlbum, usuario: usuario });
    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al crear el álbum' });
    }
    console.log('POST /album/crear');
});

router.post('/actualizar', async (req, res) => {
    try {
        const { usuario, album,  nombre} = req.body;

        // Insertar album en la base de datos
        const [result] = await db.query('UPDATE ALBUM SET NOMBRE = ? WHERE USUARIO = ? AND ID = ?;', [nombre, usuario, album]);
        res.json({ message: 'Álbum actualizado' });
    }
    catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al actualizar el álbum' });
    }
    console.log('POST /album/actualizar');
});


router.post('/eliminar', async (req, res) => {
    const connection = await db.getConnection();  // Obtener una conexión de la pool de conexiones
    try {
        const { usuario, album } = req.body;

        // Iniciar la transacción
        await connection.beginTransaction();

        // Obtener las imágenes asociadas al álbum
        const [images] = await connection.query('SELECT IMAGEN FROM IMAGEN WHERE ALBUM = ?', [album]);
        if (images.length > 0) {
            for (const img of images) {
                const imageUrl = img.IMAGEN;
                const imageName = imageUrl.split('/').pop();
                const deleteParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `Fotos_Publicadas/${imageName}`,
                };

                // Eliminar imagen del bucket S3
                await s3.send(new DeleteObjectCommand(deleteParams));
            }

            // Eliminar imágenes de la base de datos
            await connection.query('DELETE FROM IMAGEN WHERE ALBUM = ?', [album]);
        }

        // Eliminar el álbum de la base de datos
        await connection.query('DELETE FROM ALBUM WHERE USUARIO = ? AND ID = ?', [usuario, album]);

        // Confirmar transacción
        await connection.commit();

        res.json({ message: 'Álbum e imágenes eliminadas exitosamente' });
    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al eliminar el álbum y sus imágenes:', error);
        res.status(500).json({ error: error.message, message: 'Error al eliminar el álbum y sus imágenes' });
    } finally {
        connection.release();  // Liberar la conexión de vuelta a la pool
    }
    console.log('POST /album/eliminar');
});

module.exports = router;