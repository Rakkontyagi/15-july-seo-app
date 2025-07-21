'use client';

import { createContext, useContext, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import { Label } from './label';

interface FormFieldContextType {
  id: string;
  name: string;
  error?: string;
  required?: boolean;
}

const FormFieldContext = createContext<FormFieldContextType | undefined>(undefined);

interface FormFieldProps {
  children: React.ReactNode;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface FormControlProps {
  children: React.ReactNode;
  className?: string;
}

interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface FormMessageProps {
  children?: React.ReactNode;
  className?: string;
}

export function FormField({ 
  children, 
  name, 
  error, 
  required = false,
  className 
}: FormFieldProps) {
  const id = useId();

  return (
    <FormFieldContext.Provider value={{ id, name, error, required }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

export function FormLabel({ children, className }: FormLabelProps) {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('FormLabel must be used within FormField');
  }

  const { id, required } = context;

  return (
    <Label htmlFor={id} className={cn('block text-sm font-medium', className)}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
}

export function FormControl({ children, className }: FormControlProps) {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('FormControl must be used within FormField');
  }

  const { id, name, error } = context;

  return (
    <div className={cn('relative', className)}>
      {typeof children === 'function' 
        ? children({ id, name, error: !!error })
        : children
      }
    </div>
  );
}

export function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function FormMessage({ children, className }: FormMessageProps) {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('FormMessage must be used within FormField');
  }

  const { error } = context;
  const body = error || children;

  if (!body) return null;

  return (
    <p className={cn('text-sm text-destructive', className)}>
      {body}
    </p>
  );
}

// Form validation hook
export function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within FormField');
  }
  return context;
}

// Form group component for organizing related fields
export function FormGroup({ 
  children, 
  title, 
  description,
  className 
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Form section component for dividing forms
export function FormSection({ 
  children, 
  title, 
  description,
  className 
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="border-b pb-2">
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Form grid for responsive layouts
export function FormGrid({ 
  children, 
  columns = 2,
  className 
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  );
}