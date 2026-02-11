import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, details);
  }
}

