const express = require('express');
const cors = require('cors');

const app = express();
const host = '127.0.0.1';
const port = 3001;

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const imagesRouter = require('./routes/images');
const albumsRouter = require('./routes/albums');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/', indexRouter);
app.use('/usuarios', usersRouter);
app.use('/imagenes', imagesRouter);
app.use('/albumes', albumsRouter);

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});