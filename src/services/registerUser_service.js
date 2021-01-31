'use strict';
const logger = require('../config/log4js_config');
const headerSchema = require('../schemas/header_schema');
const registerUserSchema = require('../schemas/registerUser_schema');
const axios = require('axios').default;

class User {
    /**
     * @method
     * @description Valida el request de la solicitud
     * @param {object} headers cabecera de la solicitud
     * @param {object} body cuerpo de la solicitud
     * @param {object} res objeto que contiene respuesta de la solicitud
     */
    validarRequest(headers, body, res) {
        const Ajv = require('ajv');
        const ajv = new Ajv();
        let valid;

        return new Promise((resolve, reject) => {
            logger.info('Validando request de la solicitud');
            // Validando headers de la solicitud
            valid = ajv.validate(headerSchema, headers);
            if (!valid) {
                logger.error('Solicitud invalida - Headers invalidos!');
                return res.status(400).json({
                    code: '400',
                    message: `${ajv.errors[0].message}`
                });
            } else {
                // Validando body de la solicitud
                valid = ajv.validate(registerUserSchema, body);

                if (!valid) {
                    logger.info('Solicitud invalida - Body invalido!');
                    reject(
                        res.status(400).json({
                            code: '400',
                            message: `${ajv.errors[0].dataPath} - ${ajv.errors[0].message}`
                        })
                    );
                } else {
                    logger.info('Solicitud valida!');
                    resolve(body);
                }
            }
        });
    }

    /**
     * @method
     * @description Crea headers para realizar solicitud HTTP a microservicios
     * @param {object} headers cabecera de la solicitud
     * @returns {object} Objeto con headers para realizar solicitud HTTP
     */
    crearRqHeaders(headers) {
        let rqHeaders = {
            transaction_id: headers.transaction_id,
            timestamp: headers.timestamp,
            'Content-Type': 'application/json',
            accept: headers.accept,
            channel_id: headers.channel_id
        };

        return rqHeaders;
    }

    /**
     * @method
     * @description envía solicitud a ms ListUser
     * @param {object} headers cabecera de la solicitud
     * @param {String} email email para buscar a usuario
     * @param {object} res objeto de respuesta
     * @returns {object} objeto con respuesta de ms ListUser
     */
    async enviarRequestListUser(rqHeaders, email, res) {
        let config = {
            url: `/user/${email}`,
            method: 'get',
            baseURL: process.env.URI_LISTUSER,
            headers: rqHeaders,
            timeout: 5000
        };

        try {
            logger.info('Realizando solicitud ms ListUser');
            let respuestaListUser = await axios.request(config);
            logger.info('Solicitud ms ListUser exitosa');
            return respuestaListUser;
        } catch (error) {
            if (error.response) {
                let status = error.response.status;
                let code = error.response.data.code;
                let message = error.response.data.message;

                return res.status(status).json({
                    code,
                    message
                });
            } else if (error.code == 'ECONNREFUSED') {
                logger.error('Error al conectar con ms ListUser');
                return res.status(502).json({
                    code: error.code,
                    message: 'Error al conectar con ms ListUser'
                });
            } else if (error.code == 'ECONNABORTED') {
                logger.error('Timeout en ms ListUser');
                return res.status(504).json({
                    code: error.code,
                    message: 'Timeout en ms ListUser'
                });
            } else {
                logger.error('Error al conectar con ms ListUser');
                return res.status(502).json({
                    code: 'Bad Gateway',
                    message: 'Error al conectar con ms ListUser'
                });
            }
        }
    }

    /**
     * @method
     * @description crea request de ms GenerateEncryptToken
     * @param {String} email email de usuario
     * @param {String} password password de usuario
     * @param {String} nickname nickname de usuario
     * @param {integer} age edad de usuario
     * @param {String} phone telefono de usuario
     * @returns {object} objeto con cuerpo de solicitud de ms GenerateEncryptToken
     */
    crearRequestGenerateEncryptToken(email, password, nickname, age, phone) {
        let requestGenerateEncryptToken = {
            data: {
                token: {
                    payload: {
                        email,
                        password,
                        nickname,
                        age,
                        phone
                    }
                }
            }
        };

        return requestGenerateEncryptToken;
    }

    /**
     * @method
     * @description envía solicitud a ms GenerateEncryptToken
     * @param {object} rqHeaders cabecera de la solicitud
     * @param {object} requestGenerateEncryptToken cuerpo de la solicitud
     * @param {object} res objeto de respuesta
     * @returns {object} objeto con respuesta de ms GenerateEncryptToken
     */
    async enviarRequestGenerateEncryptToken(rqHeaders, requestGenerateEncryptToken, res) {
        let config = {
            url: '/token/encrypt',
            method: 'post',
            baseURL: process.env.URI_GENERATEENCRYPTTOKEN,
            headers: rqHeaders,
            data: requestGenerateEncryptToken,
            timeout: 5000
        };

        try {
            logger.info('Realizando solicitud ms GenerateEncryptToken');
            let respuestaGenerateEncryptToken = await axios.request(config);
            logger.info('Solicitud ms GenerateEncryptToken exitosa');
            return respuestaGenerateEncryptToken;
        } catch (error) {
            if (error.response) {
                let status = error.response.status;
                let code = error.response.data.code;
                let message = error.response.data.message;

                return res.status(status).json({
                    code,
                    message
                });
            } else if (error.code == 'ECONNREFUSED') {
                logger.error('Error al conectar con ms GenerateEncryptToken');
                return res.status(502).json({
                    code: error.code,
                    message: 'Error al conectar con ms GenerateEncryptToken'
                });
            } else if (error.code == 'ECONNABORTED') {
                logger.error('Timeout en ms GenerateEncryptToken');
                return res.status(504).json({
                    code: error.code,
                    message: 'Timeout en ms GenerateEncryptToken'
                });
            } else {
                logger.error('Error al conectar con ms GenerateEncryptToken');
                return res.status(502).json({
                    code: 'Bad Gateway',
                    message: 'Error al conectar con ms GenerateEncryptToken'
                });
            }
        }
    }

    /**
     * @method
     * @description genera un codigo de autorizacion de 6 digitos para registro de usuario
     * @returns {integer} devuelve codigo autorizacion de 6 digitos
     */
    generarAuthCode() {
        return parseInt(Math.random() * (999999 - 100000) + 100000);
    }

    /**
     * @method
     * @description crea request de ms InsertUserInProcess
     * @param {integer} auth_code codigo autorizacion proceso registro
     * @param {String} email email de usuario
     * @param {String} user_encrypted datos de usuario encriptados
     * @returns {object} objeto con cuerpo de solicitud de ms GenerateEncryptToken
     */
    crearRequestInsertUserInProcess(auth_code, email, user_encrypted) {
        let requestInsertUserInProcess = {
            data: {
                auth_code,
                client_data: {
                    email
                },
                user_encrypted
            }
        };

        return requestInsertUserInProcess;
    }

    /**
     * @method
     * @description envía solicitud a ms InsertUserInProcess
     * @param {object} rqHeaders cabecera de la solicitud
     * @param {object} requestInsertUserInProcess cuerpo de la solicitud
     * @param {object} res objeto de respuesta
     * @returns {object} objeto con respuesta de ms InsertUserInProcess
     */
    async enviarRequestInsertUserInProcess(rqHeaders, requestInsertUserInProcess, res) {
        let config = {
            url: '/user/in-process',
            method: 'post',
            baseURL: process.env.URI_INSERTUSERINPROCESS,
            headers: rqHeaders,
            data: requestInsertUserInProcess,
            timeout: 5000
        };

        try {
            logger.info('Realizando solicitud ms InsertUserInProcess');
            let respuestaInsertUserInProcess = await axios.request(config);
            logger.info('Solicitud ms InsertUserInProcess exitosa');
            return respuestaInsertUserInProcess;
        } catch (error) {
            if (error.response) {
                let status = error.response.status;
                let code = error.response.data.code;
                let message = error.response.data.message;

                return res.status(status).json({
                    code,
                    message
                });
            } else if (error.code == 'ECONNREFUSED') {
                logger.error('Error al conectar con ms InsertUserInProcess');
                return res.status(502).json({
                    code: error.code,
                    message: 'Error al conectar con ms InsertUserInProcess'
                });
            } else if (error.code == 'ECONNABORTED') {
                logger.error('Timeout en ms InsertUserInProcess');
                return res.status(504).json({
                    code: error.code,
                    message: 'Timeout en ms InsertUserInProcess'
                });
            } else {
                logger.error('Error al conectar con ms InsertUserInProcess');
                return res.status(502).json({
                    code: 'Bad Gateway',
                    message: 'Error al conectar con ms InsertUserInProcess'
                });
            }
        }
    }

    /**
     * @method
     * @description crea request de ms SendMail
     * @param {String} email email de desino de correo
     * @param {String} nickname nickname de usuario
     * @param {String} code codigo registro usuario
     * @returns {object} objeto con cuerpo de solicitud de ms SendMail
     */
    crearRequestSendMail(email, nickname, code) {
        let requestSendMail = {
            data: {
                id_template: 'verificacionRegistro',
                email_info: {
                    from_description: 'Juegos Don',
                    to: email,
                    subject: 'Verificación registro'
                },
                list_params: {
                    params: [
                        {
                            name: 'nickname',
                            value: nickname
                        },
                        {
                            name: 'code',
                            value: code
                        }
                    ]
                }
            }
        };

        return requestSendMail;
    }

    /**
     * @method
     * @description envía solicitud a ms SendMail
     * @param {object} rqHeaders cabecera de la solicitud
     * @param {object} requestSendMail cuerpo de la solicitud
     * @param {object} res objeto de respuesta
     * @returns {object} objeto con respuesta de ms SendMail
     */
    async enviarRequestSendMail(rqHeaders, requestSendMail, res) {
        let config = {
            url: '/send/mail',
            method: 'post',
            baseURL: process.env.URI_SENDMAIL,
            headers: rqHeaders,
            data: requestSendMail,
            timeout: 5000
        };

        try {
            logger.info('Realizando solicitud ms SendMail');
            let respuestaSendMail = await axios.request(config);
            logger.info('Solicitud ms SendMail exitosa');

            return respuestaSendMail;
        } catch (error) {
            if (error.response) {
                let status = error.response.status;
                let code = error.response.data.code;
                let message = error.response.data.message;

                return res.status(status).json({
                    code,
                    message
                });
            } else if (error.code == 'ECONNREFUSED') {
                logger.error('Error al conectar con ms SendMail');
                return res.status(502).json({
                    code: error.code,
                    message: 'Error al conectar con ms SendMail'
                });
            } else if (error.code == 'ECONNABORTED') {
                logger.error('Timeout en ms SendMail');
                return res.status(504).json({
                    code: error.code,
                    message: 'Timeout en ms SendMail'
                });
            } else {
                logger.error('Error al conectar con ms SendMail');
                return res.status(502).json({
                    code: 'Bad Gateway',
                    message: 'Error al conectar con ms SendMail'
                });
            }
        }
    }
}

module.exports = User;
