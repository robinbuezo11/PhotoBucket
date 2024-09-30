const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const axios = require('axios');
const imageProccesor = require('../utils/analyze.image');
const translateText = require('../utils/translate.text');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Configure AWS
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Get all images
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM IMAGEN;');
        const imgs = rows.map (img => {
            return {
                id:             img.ID,
                nombre:         img.NOMBRE,
                descripcion:    img.DESCRIPCION,
                imagen:         img.IMAGEN,
                album:          img.ALBUM,
                creacion:       img.CREACION
            }
        });
        res.json(imgs);
    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al obtener las imagenes' });
    }
    console.log('GET /imagenes');
});

router.get('/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;  // Obtén el ID del usuario de los parámetros

    try {
        const [rows] = await db.query(
            `SELECT img.ID, img.NOMBRE, img.DESCRIPCION, img.IMAGEN, img.ALBUM, img.CREACION 
             FROM IMAGEN img
             JOIN ALBUM alb ON img.ALBUM = alb.ID
             WHERE alb.USUARIO = ?`, 
            [usuarioId]  // Pasar el ID del usuario como parámetro
        );

        const imgs = rows.map(img => {
            return {
                id: img.ID,
                nombre: img.NOMBRE,
                descripcion: img.DESCRIPCION,
                imagen: img.IMAGEN,
                album: img.ALBUM,
                creacion: img.CREACION
            };
        });
        
        res.json(imgs);
    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al obtener las imágenes' });
    }
    
    console.log('GET /imagenes');
});

router.get('/image/:imageId', async (req, res) => {
    const { imageId } = req.params;
    try {
        const [imageRows] = await db.query(
            `SELECT ID, NOMBRE, DESCRIPCION, IMAGEN, ALBUM, CREACION 
             FROM IMAGEN 
             WHERE ID = ?`, 
            [imageId]
        );

        if (imageRows.length === 0) {
            return res.status(404).json({ message: 'Imagen no encontrada' });
        }

        const albumId = imageRows[0].ALBUM;

        const [albumRows] = await db.query(
            `SELECT NOMBRE FROM ALBUM WHERE ID = ?`, 
            [albumId]
        );

        if (albumRows.length === 0) {
            return res.status(404).json({ message: 'Álbum no encontrado' });
        }

        const imageUrl = imageRows[0].IMAGEN;
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        const labels = await imageProccesor.analyzeImage(base64Image);

        const img = {
            id: imageRows[0].ID,
            nombre: imageRows[0].NOMBRE,
            descripcion: imageRows[0].DESCRIPCION,
            imagen: imageRows[0].IMAGEN,
            album: albumRows[0].NOMBRE,
            creacion: imageRows[0].CREACION,
            labels
        };

        res.json(img);

    } catch (error) {
        res.status(500).json({ error: error.message, message: 'Error al obtener la imagen' });
    }
    console.log(`GET /imagenes/image/${imageId}`);
});


// Subir imagen
router.post('/subir', async (req, res) => {
    try {
        const { nombre, descripcion, imagen, album } = req.body;
        
        // Validación de campos obligatorios
        if (!nombre || !imagen || !album) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', message: 'Faltan campos obligatorios' });
        }

        // Procesar la imagen en base64
        const imageBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        // Parámetros para subir la imagen a S3
        const params = {
            Bucket:             process.env.AWS_BUCKET_NAME,
            Key:                `Fotos_Publicadas/${nombre}-${Date.now()}.png`,
            Body:               imageBuffer,
            ContentEncoding:    'base64',
            ContentType:        'image/png'
        };

        // Subir imagen a S3
        const upload = new Upload({ client: s3, params });
        const s3Data = await upload.done();
        const imageUrl = s3Data.Location;

        // Guardar la información de la imagen en la base de datos
        const query = 'INSERT INTO IMAGEN (NOMBRE, DESCRIPCION, IMAGEN, ALBUM) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [nombre, descripcion, imageUrl, album]);

        // Obtener la imagen recién insertada para retornarla
        const [insertedImage] = await db.query('SELECT * FROM IMAGEN WHERE ID = ?', [result.insertId]);
        const image = insertedImage[0];

        // Formatear los datos de la imagen para la respuesta
        const imageData = {
            id: image.ID,
            nombre: image.NOMBRE,
            descripcion: image.DESCRIPCION,
            imagen: image.IMAGEN,
            album: image.ALBUM,
            creacion: image.CREACION
        };

        res.json(imageData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('POST /imagenes/subir');
});

// Eliminar imagen
router.delete('/eliminar', async (req, res) => {
    try {
        const { imagen } = req.body;

        // Obtener la imagen de la base de datos
        const [rows] = await db.query('SELECT IMAGEN FROM IMAGEN WHERE ID = ?', [imagen]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Imagen no encontrada', message: 'Imagen no encontrada en la base de datos' });
        }

        const imageUrl = rows[0].IMAGEN;

        // Extraer el nombre del archivo de la URL de S3
        const imageName = imageUrl.split('/').pop();

        // Parámetros para eliminar la imagen de S3
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `Fotos_Publicadas/${imageName}`,
        };

        // Eliminar la imagen del bucket de S3
        await s3.send(new DeleteObjectCommand(deleteParams));

        // Eliminar la imagen de la base de datos
        await db.query('DELETE FROM IMAGEN WHERE ID = ?', [imagen]);

        res.json({ message: 'Imagen eliminada exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('DELETE /imagenes/eliminar');
});

router.post('/analyzeImage', async (req, res) => {
    try {
        const { imagen } = req.body;
        if (!imagen) {
            return res.status(400).json({ message: 'Imagen no proporcionada' });
        }
        const imageBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        if (!imageBuffer) {
            return res.status(400).json({ message: 'Error al procesar la imagen' });
        }
        const labels = await imageProccesor.extractText(imageBuffer);
        res.json({ labels });
    } catch (err) {
        console.error('Error al analizar la imagen:', err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('POST /analyzeImage');
});

router.post('/translateText', async (req, res) => {
    try{
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        const translatedText = await translateText(text, targetLanguage);
        res.json({ translatedText });
    }catch(err){
        console.error('Error al traducir el texto:', err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
});


module.exports = router;