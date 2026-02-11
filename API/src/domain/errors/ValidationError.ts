import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super(message, 400, details);
  }
}

