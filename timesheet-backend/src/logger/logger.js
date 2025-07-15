const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
    new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../logs/rejections.log') }),
  ],
});

module.exports = logger;
