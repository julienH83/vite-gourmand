const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: 'info',
        // JSON structuré en prod — parsable par Datadog, Loki, etc.
      }
);

module.exports = logger;
