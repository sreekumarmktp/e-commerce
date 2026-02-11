import { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { AppError } from '../../domain/errors/AppError';

export const errorHandlerPlugin: FastifyPluginCallback = (app: FastifyInstance, _opts, done) => {
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
      path: req.url
    });
  });

  app.setErrorHandler((err: any, _req, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send({
        success: false,
        error: err.message,
        details: err.details
      });
      return;
    }

    // Fastify validation errors often include `validation` details
    const anyErr = err as any;
    if (anyErr?.validation) {
      reply.code(400).send({
        success: false,
        error: anyErr.message || 'Validation error',
        details: anyErr.validation
      });
      return;
    }

    if (err.message === 'premature close') {
      app.log.warn('Client disconnected prematurely');
      return;
    }

    app.log.error(err);
    reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  });

  done();
};

