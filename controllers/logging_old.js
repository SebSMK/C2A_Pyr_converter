const winston = require('winston');
winston.emitErrs = true;

const logger = new winston.Logger({
    levels: {
        'debug': 0, 
        'info': 1,
        'express_log': 2,
        'error': 3
    },
    colors : {
        debug: 'blue',
        info: 'green',
        express_log: 'grey',
        error: 'red'
    },
    transports: [
        new winston.transports.File({
            level: 'debug',
            filename: './pyr_converter.log',
            handleExceptions: true,
            json: false,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: true
        }),
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true,
            timestamp: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.express_log(message.slice(0, -1)); /*slice avoids newlines*/
    }
};

