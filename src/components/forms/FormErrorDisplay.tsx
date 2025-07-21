/**
 * Form Error Display Components for SEO Automation App
 * Provides comprehensive error display and validation feedback for forms
 */

'use client';

import React from 'react';
import { AlertCircle, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormError {
  field?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export interface FormErrorDisplayProps {
  errors: FormError[];
  className?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: (index: number) => void;
}

export interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  className?: string;
}

export interface ValidationFeedbackProps {
  value: string;
  rules: ValidationRule[];
  className?: string;
}

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  type?: 'error' | 'warning' | 'success';
}

/**
 * Main form error display component
 */
export function FormErrorDisplay({
  errors,
  className,
  showIcon = true,
  dismissible = false,
  onDismiss
}: FormErrorDisplayProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {errors.map((error, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-2 p-3 rounded-md border text-sm',
            {
              'bg-red-50 border-red-200 text-red-700': error.type === 'error' || !error.type,
              'bg-yellow-50 border-yellow-200 text-yellow-700': error.type === 'warning',
              'bg-blue-50 border-blue-200 text-blue-700': error.type === 'info'
            }
          )}
        >
          {showIcon && (
            <div className="flex-shrink-0 mt-0.5">
              {(error.type === 'error' || !error.type) && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {error.type === 'warning' && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              {error.type === 'info' && (
                <AlertCircle className="h-4 w-4 text-blue-500" />
              )}
            </div>
          )}
          
          <div className="flex-1">
            {error.field && (
              <span className="font-medium">{error.field}: </span>
            )}
            {error.message}
          </div>

          {dismissible && onDismiss && (
            <button
              onClick={() => onDismiss(index)}
              className={cn(
                'flex-shrink-0 p-1 rounded-md hover:bg-opacity-20',
                {
                  'hover:bg-red-200': error.type === 'error' || !error.type,
                  'hover:bg-yellow-200': error.type === 'warning',
                  'hover:bg-blue-200': error.type === 'info'
                }
              )}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Individual field error component
 */
export function FieldError({ error, touched, className }: FieldErrorProps) {
  if (!error || !touched) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1 mt-1 text-sm text-red-600', className)}>
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

/**
 * Real-time validation feedback component
 */
export function ValidationFeedback({ value, rules, className }: ValidationFeedbackProps) {
  const results = rules.map(rule => ({
    ...rule,
    passed: rule.test(value)
  }));

  return (
    <div className={cn('space-y-1 mt-2', className)}>
      {results.map((result, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-2 text-xs',
            {
              'text-green-600': result.passed && result.type !== 'warning',
              'text-red-600': !result.passed && (result.type === 'error' || !result.type),
              'text-yellow-600': result.type === 'warning',
              'text-gray-500': !result.passed && result.type === 'success'
            }
          )}
        >
          <div className="flex-shrink-0">
            {result.passed ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
          </div>
          <span>{result.message}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Form section error summary
 */
export interface FormSectionErrorProps {
  title: string;
  errors: FormError[];
  className?: string;
}

export function FormSectionError({ title, errors, className }: FormSectionErrorProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
      </div>
      <ul className="text-sm text-red-700 space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start gap-1">
            <span className="text-red-500 mt-1">•</span>
            <span>
              {error.field && <span className="font-medium">{error.field}: </span>}
              {error.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Inline field validation status
 */
export interface FieldValidationStatusProps {
  isValid?: boolean;
  isValidating?: boolean;
  error?: string;
  className?: string;
}

export function FieldValidationStatus({
  isValid,
  isValidating,
  error,
  className
}: FieldValidationStatusProps) {
  if (isValidating) {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-gray-500', className)}>
        <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full" />
        <span>Validating...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-red-600', className)}>
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-green-600', className)}>
        <CheckCircle className="h-3 w-3" />
        <span>Valid</span>
      </div>
    );
  }

  return null;
}

/**
 * Form submission error banner
 */
export interface FormSubmissionErrorProps {
  error?: string;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function FormSubmissionError({
  error,
  retryable = false,
  onRetry,
  onDismiss,
  className
}: FormSubmissionErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Submission Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded border border-red-300 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Success message component
 */
export interface FormSuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function FormSuccessMessage({ message, onDismiss, className }: FormSuccessMessageProps) {
  return (
    <div className={cn('bg-green-50 border border-green-200 rounded-md p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{message}</p>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-500 hover:text-green-700 transition-colors ml-4"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Common validation rules
 */
export const commonValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value: string) => value.trim().length > 0,
    message,
    type: 'error'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
    type: 'error'
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
    type: 'error'
  }),

  email: (message = 'Must be a valid email address'): ValidationRule => ({
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    type: 'error'
  }),

  url: (message = 'Must be a valid URL'): ValidationRule => ({
    test: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    type: 'error'
  }),

  strongPassword: (message = 'Password must contain uppercase, lowercase, number, and special character'): ValidationRule => ({
    test: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value),
    message,
    type: 'error'
  }),

  noSpecialChars: (message = 'Cannot contain special characters'): ValidationRule => ({
    test: (value: string) => /^[a-zA-Z0-9\s-_]+$/.test(value),
    message,
    type: 'warning'
  })
};
