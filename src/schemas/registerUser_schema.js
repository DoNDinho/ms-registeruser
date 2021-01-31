const registerUserSchema = {
    type: 'object',
    properties: {
        data: {
            type: 'object',
            properties: {
                client_credentials: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            minLength: 1
                        },
                        password: {
                            type: 'string',
                            minLength: 1
                        }
                    },
                    required: ['email', 'password']
                },
                client_data: {
                    type: 'object',
                    properties: {
                        nickname: {
                            type: 'string',
                            minLength: 1
                        },
                        age: {
                            type: 'integer',
                            minimum: 13
                        },
                        phone: {
                            type: 'string',
                            pattern: '^([0-9])*$',
                            minLength: 1
                        }
                    },
                    required: ['nickname', 'age', 'phone']
                }
            },
            required: ['client_credentials', 'client_data']
        }
    },
    required: ['data']
};

module.exports = registerUserSchema;
