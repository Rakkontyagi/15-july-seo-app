
export enum ErrorType {
  Temporary = 'Temporary',
  Permanent = 'Permanent',
  Client = 'Client',
  Server = 'Server',
  Unknown = 'Unknown',
}

export enum ErrorSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface ClassifiedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  resolutionStrategy: string;
  originalError?: any;
}

export class ErrorClassifier {
  classify(error: any): ClassifiedError {
    let type: ErrorType = ErrorType.Unknown;
    let severity: ErrorSeverity = ErrorSeverity.Medium;
    let message: string = 'An unknown error occurred.';
    let resolutionStrategy: string = 'Investigate logs for more details.';

    if (error instanceof Error) {
      message = error.message;
    }

    // Axios errors (HTTP errors)
    if (error.isAxiosError) {
      const status = error.response?.status;
      if (status) {
        if (status >= 400 && status < 500) {
          type = ErrorType.Client;
          severity = ErrorSeverity.High;
          message = `Client error: ${status} - ${error.response?.data?.message || error.message}`;
          resolutionStrategy = 'Check request parameters and API key.';
          if (status === 403) {
            message = 'Authentication failed or access denied.';
            resolutionStrategy = 'Verify API key and permissions.';
          } else if (status === 404) {
            message = 'Resource not found.';
            resolutionStrategy = 'Check endpoint URL and resource ID.';
          } else if (status === 429) {
            type = ErrorType.Temporary;
            severity = ErrorSeverity.Medium;
            message = 'Rate limit exceeded.';
            resolutionStrategy = 'Implement rate limiting and exponential backoff.';
          }
        } else if (status >= 500 && status < 600) {
          type = ErrorType.Server;
          severity = ErrorSeverity.Critical;
          message = `Server error: ${status} - ${error.response?.data?.message || error.message}`;
          resolutionStrategy = 'Retry with exponential backoff. Contact API provider if persistent.';
          if (status === 503 || status === 504) {
            type = ErrorType.Temporary;
            severity = ErrorSeverity.High;
            message = 'Service unavailable or gateway timeout.';
            resolutionStrategy = 'Retry after a short delay.';
          }
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      type = ErrorType.Temporary;
      severity = ErrorSeverity.Medium;
      message = 'Request timed out.';
      resolutionStrategy = 'Increase timeout settings or optimize request.';
    } else if (error.name === 'ZodError') {
      type = ErrorType.Client;
      severity = ErrorSeverity.High;
      message = `Validation error: ${error.message}`;
      resolutionStrategy = 'Correct input data according to schema.';
    }

    return {
      type,
      severity,
      message,
      resolutionStrategy,
      originalError: error,
    };
  }
}
