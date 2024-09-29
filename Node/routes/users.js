const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const  compareImages  = require('../utils/compare.images');
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

// Get all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM USUARIO');
        // Delete password field and minimize data
        const users = rows.map(user => {
            return {
                id: user.ID,
                usuario: user.USUARIO,
                correo: user.CORREO,
                imagen: user.IMAGEN,
                recactivo: user.RECACTIVO,
                recimagen: user.RECIMAGEN,
                creacion: user.CREACION
            };
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('GET /usuarios');
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        // Validate required fields
        if (!usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', message: 'Faltan campos obligatorios' });
        }
        // Check if user is admin
        if (usuario === 'admin' && password === 'admin') {
            // Return a special response for the admin
            return res.json({
                id: 1,
                usuario: 'admin',
                correo: 'admin@example.com',
                imagen: 'url_to_admin_image',
                recactivo: true,
                recimagen: 'url_to_admin_image',
                creacion: new Date().toISOString()
            });
        }
        // Check if user exists
        let [rows] = await db.query('SELECT * FROM USUARIO WHERE USUARIO = ? OR CORREO = ?', [usuario, usuario]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });
        }
        const user = rows[0];
        // Check if password is correct
        const match = await bcrypt.compare(password, user.CONTRASENA);
        if (!match) {
            return res.status(401).json({ error: 'Contraseña incorrecta', message: 'Contraseña incorrecta' });
        }
        // Delete password field and minimize data
        const userData = {
            id: user.ID,
            usuario: user.USUARIO,
            correo: user.CORREO,
            imagen: user.IMAGEN,
            recactivo: user.RECACTIVO,
            recimagen: user.RECIMAGEN,
            creacion: user.CREACION
        };
        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('POST /usuarios/login');
});

// Register
router.post('/registrar', async (req, res) => {
    try {
        const { usuario, correo, password, imagen } = req.body;
        // Validate required fields
        if (!usuario || !correo || !password || !imagen) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', message: 'Faltan campos obligatorios' });
        }
        // Check if user already exists
        let [rows] = await db.query('SELECT ID FROM USUARIO WHERE USUARIO = ? OR CORREO = ?', [usuario, correo]);
        if (rows.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe', message: 'El usuario ya existe' });
        }

        // Upload image to S3
        const imageBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `Fotos_Perfil/${usuario}-${Date.now()}.png`,
            Body: imageBuffer,
            ContentEncoding: 'base64',
            ContentType: 'image/png'
        };
        const upload = new Upload({ client: s3, params });
        const s3Data = await upload.done();
        const imageUrl = s3Data.Location;

        // Hash password
        const hash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const query = 'INSERT INTO USUARIO (USUARIO, CORREO, CONTRASENA, IMAGEN) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [usuario, correo, hash, imageUrl]);
        const [usert] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [result.insertId]);
        const user = usert[0];
        // Delete password field and minimize data
        const userData = {
            id: user.ID,
            usuario: user.USUARIO,
            correo: user.CORREO,
            imagen: user.IMAGEN,
            recactivo: user.RECACTIVO,
            recimagen: user.RECIMAGEN,
            creacion: user.CREACION
        };
        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('POST /usuarios/register');
});

// Update user
router.put('/actualizar', async (req, res) => {
    try {
        const { id, usuario, correo, password, imagen, recactivo, recimagen, confirma_password } = req.body;
        // Validate required fields
        if (!id || !usuario || !correo || !confirma_password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', message: 'Faltan campos obligatorios' });
        }
        // Check if user exists and password is correct
        let [rows] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [id]);
        let user;
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });
        } else {
            user = rows[0];
            const match = await bcrypt.compare(confirma_password, user.CONTRASENA);
            if (!match) {
                return res.status(401).json({ error: 'Contraseña incorrecta', message: 'Contraseña incorrecta' });
            }
        }
        // Check if new user already exists
        [rows] = await db.query('SELECT ID FROM USUARIO WHERE (USUARIO = ? OR CORREO = ?) AND ID != ?', [usuario, correo, id]);
        if (rows.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe', message: 'El usuario ya existe' });
        }

        // Delete recimage from S3 if a new recimage is uploaded
        const oldRecImagen = decodeURIComponent(user.RECIMAGEN);
        let newRecImagen = oldRecImagen;
        if (recimagen) {
            if (recactivo === false || recactivo === 0) {
                return res.status(400).json({ error: 'Debe activar el reconocimiento facial', message: 'Debe activar el reconocimiento facial para subir una imagen' });
            }
            if (oldRecImagen && oldRecImagen !== 'null') {
                console.log('oldRecImagen', oldRecImagen);
                const key = oldRecImagen.split('.com/')[1];
                await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
            }

            // Upload new recimage to S3
            const recimageBuffer = Buffer.from(recimagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `Fotos_Reconocimiento_Facial/${usuario}-${Date.now()}.png`,
                Body: recimageBuffer,
                ContentEncoding: 'base64',
                ContentType: 'image/png'
            };
            const upload = new Upload({ client: s3, params });
            const s3Data = await upload.done();
            newRecImagen = s3Data.Location;
        } else {
            if (recactivo === true || recactivo === 1) {
                return res.status(400).json({ error: 'Debe subir una imagen para activar el reconocimiento facial', message: 'Debe subir una imagen para activar el reconocimiento facial' });
            }
        }

        // Delete image from S3 if a new image is uploaded
        const oldImagen = decodeURIComponent(user.IMAGEN);
        let newImagen = oldImagen;
        if (imagen) {
            const key = oldImagen.split('.com/')[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));

            // Upload new image to S3
            const imageBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `Fotos_Perfil/${usuario}-${Date.now()}.png`,
                Body: imageBuffer,
                ContentEncoding: 'base64',
                ContentType: 'image/png'
            };
            const upload = new Upload({ client: s3, params });
            const s3Data = await upload.done();
            newImagen = s3Data.Location;
        }

        let pass = user.CONTRASENA;
        if (password) {
            pass = await bcrypt.hash(password, saltRounds);
        }
        let reconocimiento = recactivo ? recactivo : user.RECACTIVO;

        // Update user in database
        const query = 'UPDATE USUARIO SET USUARIO = ?, CORREO = ?, CONTRASENA = ?, IMAGEN = ?, RECACTIVO = ?, RECIMAGEN = ? WHERE ID = ?';
        await db.query(query, [usuario, correo, pass, newImagen, reconocimiento, newRecImagen, id]);
        const [usert] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [id]);
        const updatedUser = usert[0];
        // Delete password field and minimize data
        const userData = {
            id: updatedUser.ID,
            usuario: updatedUser.USUARIO,
            correo: updatedUser.CORREO,
            imagen: updatedUser.IMAGEN,
            recactivo: updatedUser.RECACTIVO,
            recimagen: updatedUser.RECIMAGEN,
            creacion: updatedUser.CREACION
        };
        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('PUT /usuarios/actualizar');
});

// Delete user
router.delete('/eliminar/', async (req, res) => {
    try {
        const { id, password } = req.body;
        // Check if user exists
        let [rows] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });
        }
        // Check if password is correct
        const match = await bcrypt.compare(password, rows[0].CONTRASENA);
        if (!match) {
            return res.status(401).json({ error: 'Contraseña incorrecta', message: 'Contraseña incorrecta' });
        }
        
        // Delete image from S3
        const imagen = decodeURIComponent(rows[0].IMAGEN);
        if (imagen) {
            const key = imagen.split('.com/')[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
        }
        // Delete recimage from S3
        const recimagen = decodeURIComponent(rows[0].RECIMAGEN);
        if (recimagen) {
            const key = recimagen.split('.com/')[1];
            if (key) { // Verifica que key no sea undefined o vacío
                await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
            } else {
                console.error('Key is undefined or empty.');
            }
        }
        // Delete user from database
        await db.query('DELETE FROM USUARIO WHERE ID = ?', [id]);
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('DELETE /usuarios/eliminar');
});

router.post('/logingCamera', async (req, res) => {
    try {
        const { picture } = req.body;
        if (!picture) {
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }
        const [userRows] = await db.query('SELECT RECIMAGEN FROM USUARIO');
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'No hay usuarios registrados' });
        }
        for (const user of userRows) {
            const currentPicture = user.RECIMAGEN;
            const url = await uploader.uploadImage(picture, 'login');
            const comparisonResult = await compareImages(currentPicture, url);
            if (comparisonResult) {
                return res.status(200).json({ message: 'Acceso concedido' });
            }
        }
        return res.status(401).json({ error: 'Acceso denegado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
});

router.post('/faceId', async (req, res) => {
    try {
        const { id, recimagen, recactivo, confirma_password } = req.body;
        let [rows] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [id]);
        let user;

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });
        } else {
            user = rows[0];
            const match = await bcrypt.compare(confirma_password, user.CONTRASENA);
            if (!match) {
                return res.status(401).json({ error: 'Contraseña incorrecta', message: 'Contraseña incorrecta' });
            }
        }

        let newRecImagen = null;
        const reconocimiento = recactivo ? 1 : 0;

        if (recimagen) {
            if (!recactivo) {
                return res.status(400).json({ error: 'Debe activar el reconocimiento facial', message: 'Debe activar el reconocimiento facial para subir una imagen' });
            }

            const recimageBuffer = Buffer.from(recimagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `Fotos_Reconocimiento_Facial/${rows[0].USUARIO}-${Date.now()}.png`,
                Body: recimageBuffer,
                ContentEncoding: 'base64',
                ContentType: 'image/png'
            };
            const upload = new Upload({ client: s3, params });
            const s3Data = await upload.done();
            newRecImagen = s3Data.Location;
        } else {
            if (recactivo) {  
                return res.status(400).json({ error: 'Debe subir una imagen para activar el reconocimiento facial', message: 'Debe subir una imagen para activar el reconocimiento facial' });
            }
        }

        const query = 'UPDATE USUARIO SET RECACTIVO = ?, RECIMAGEN = ? WHERE ID = ?';
        await db.query(query, [reconocimiento, newRecImagen, id]);
        const [usert] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [id]);
        const updatedUser = usert[0];

        const userData = {
            id: updatedUser.ID,
            usuario: updatedUser.USUARIO,
            correo: updatedUser.CORREO,
            imagen: updatedUser.IMAGEN,
            recactivo: updatedUser.RECACTIVO,
            recimagen: updatedUser.RECIMAGEN,
            creacion: updatedUser.CREACION
        };
        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }

    console.log('POST /faceId');
});



module.exports = router;