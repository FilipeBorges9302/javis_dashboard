// Error handling utilities for the AI Dashboard

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Ensure the name of this error is the same as the class name
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    const fullMessage = field ? `Validation failed for ${field}: ${message}` : `Validation failed: ${message}`;
    super(fullMessage, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class StorageError extends AppError {
  constructor(message: string, operation?: string) {
    const fullMessage = operation ? `Storage error during ${operation}: ${message}` : `Storage error: ${message}`;
    super(fullMessage, 500, 'STORAGE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error handling middleware for API routes
export function handleApiError(error: unknown): { status: number; body: any } {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    };
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    const errorMessages = zodError.issues?.map((issue: any) =>
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ');

    return {
      status: 400,
      body: {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errorMessages,
      },
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    };
  }

  // Handle unknown errors
  return {
    status: 500,
    body: {
      success: false,
      error: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    },
  };
}

// Async error wrapper for API handlers
export function asyncHandler(handler: Function) {
  return async (req: Request, res: Response) => {
    try {
      return await handler(req, res);
    } catch (error) {
      const { status, body } = handleApiError(error);
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

// Error logging utility
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? ` [${context}]` : '';

  if (error instanceof AppError) {
    console.error(`${timestamp}${contextInfo} AppError [${error.code}]:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
  } else if (error instanceof Error) {
    console.error(`${timestamp}${contextInfo} Error:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error(`${timestamp}${contextInfo} Unknown error:`, error);
  }
}

// Retry utility for external services
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      console.warn(`Operation failed on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw new ExternalServiceError('Retry', `Operation failed after ${maxRetries} attempts: ${lastError!.message}`);
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime >= this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError('Circuit Breaker', 'Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }

    // Reset failure count after monitoring period
    setTimeout(() => {
      if (this.state === 'CLOSED') {
        this.failures = 0;
      }
    }, this.monitoringPeriod);
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Health check utility
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  timestamp: Date;
}

export async function performHealthCheck(
  name: string,
  checkFunction: () => Promise<boolean>
): Promise<HealthCheck> {
  const start = Date.now();
  const timestamp = new Date();

  try {
    const isHealthy = await checkFunction();
    const responseTime = Date.now() - start;

    return {
      name,
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'Service is operational' : 'Service check failed',
      responseTime,
      timestamp,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      name,
      status: 'unhealthy',
      message: `Health check failed: ${message}`,
      responseTime,
      timestamp,
    };
  }
}

// Error boundary component data
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  errorId?: string;
}

export function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error reporting utility (for future integration with monitoring services)
export function reportError(error: Error, context?: Record<string, any>): void {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  // Log to console for now (in production, send to monitoring service)
  console.error('Error Report:', errorReport);

  // TODO: Integrate with monitoring service like Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error, { contexts: { custom: context } });
}