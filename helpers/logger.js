const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

const logfolder = path.join(path.dirname(require.main.filename), 'logs');

if (!fs.existsSync(logfolder))
  fs.mkdirSync(logfolder);


const filename = path.join(logfolder, 'all.log');


/* defining formats for console and file transports */
const consoleFormat = format.printf(info => {
  const message = info.message.trim ? info.message.trim() : info.message;
  return `${info.timestamp} [${info.source}] ${info.level}: ${message}`;
});

const jsonFormat = format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()
);


/* creates logger and loads file and console transport */
const logger = createLogger({
  transports: [
    new transports.Console({
      level: 'silly',
      handleExceptions: true,
      format: format.combine(
          format.colorize(),
          format.timestamp({
            format: 'YYYY-MM-DD, HH:mm:ss'
          }),
          consoleFormat
      )
    }),
    new transports.File({
      level: 'debug',
      filename: filename,
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat
    })
  ]
});


module.exports = logger;

