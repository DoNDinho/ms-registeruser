'use strict';
const logger = require('../config/log4js_config');
const User = require('../services/registerUser_service');

exports.registerUser = async (req, res) => {
    try {
        let transactionId = req.headers.transaction_id;
        logger.addContext('transaction_id', transactionId);

        let headers = req.headers;
        let body = req.body;
        let email = body.data.client_credentials.email;
        let password = body.data.client_credentials.password;
        let nickname = body.data.client_data.nickname;
        let age = body.data.client_data.age;
        let phone = body.data.client_data.phone;

        let user = new User();

        try {
            await user.validarRequest(headers, body, res);
            let rqHeaders = user.crearRqHeaders(headers);
            let respuestaListUser = await user.enviarRequestListUser(rqHeaders, email, res);

            console.log(respuestaListUser.data);

            // Valida respuesta de List User
            if (respuestaListUser.data.hasOwnProperty('data')) {
                // Si el usuario existe, termina el flujo de registro
                logger.info('Usuario ya se encuentra registrado');
                return res.status(422).json({
                    code: '422',
                    message: 'Usuario ya se encuentra registrado'
                });
            } else {
                // Si el usuario no existe, continua con el flujo de registro
                logger.info('Usuario no se encuentra registrado');

                let requestGenerateEncryptToken = await user.crearRequestGenerateEncryptToken(email, password, nickname, age, phone);
                let respuestaGenerateEncryptToken = await user.enviarRequestGenerateEncryptToken(rqHeaders, requestGenerateEncryptToken, res);
                let user_encrypted = respuestaGenerateEncryptToken.data.data.encrypted_token;
                let auth_code = user.generarAuthCode();
                let requestInsertUserInProcess = user.crearRequestInsertUserInProcess(auth_code, email, user_encrypted);
                let respuestaInsertUserInProcess = await user.enviarRequestInsertUserInProcess(rqHeaders, requestInsertUserInProcess, res);

                // Variables de respuesta ms InsertUserInProcess
                auth_code = respuestaInsertUserInProcess.data.data.auth_code.toString();
                let requestSendMail = user.crearRequestSendMail(email, nickname, auth_code);
                await user.enviarRequestSendMail(rqHeaders, requestSendMail, res);

                // Devolviendo respuesta exitosa del flujo
                res.json({
                    data: {
                        message: `Hemos enviado un correo a la direccion ${email}. Ingresa el código para continuar con la operación.`
                    }
                });
            }
        } catch (err) {
            return err;
        }
    } catch (err) {
        logger.error('Ha ocurrido un error en metodo Register User Controler ', err);
        return res.status(500).json({
            code: '500',
            message: 'Internal Server Error'
        });
    }
};
