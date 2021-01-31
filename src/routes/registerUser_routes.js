'use strict';
const express = require('express');
const router = express.Router();
const registerUserController = require('../controllers/registerUser_controller');

// Metodo para iniciar proceso de registro de usuario
router.post('/user/register', registerUserController.registerUser);

module.exports = router;
