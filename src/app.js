'use strict';
const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT;
const bodyParser = require('body-parser');
const logger = require('./config/log4js_config');
const router = require('./routes/registerUser_routes');

// Configurando body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// configurando rutas
app.use(router);

// Iniciando servidor
app.listen(PORT, () => {
    logger.info('Servidor en puerto ', PORT);
});
