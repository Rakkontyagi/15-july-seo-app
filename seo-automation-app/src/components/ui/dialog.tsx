'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ isOpen, onClose, children, className, size = 'md', showCloseButton = true }, ref) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleBackdropClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    };

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div
          ref={dialogRef}
          className={cn(
            'relative w-full rounded-lg bg-background p-6 shadow-lg',
            sizeClasses[size],
            className
          )}
          tabIndex={-1}
        >
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
          {children}
        </div>
      </div>
    );
  }
);

Dialog.displayName = 'Dialog';

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn('', className)}>
      {children}
    </div>
  )
);

DialogContent.displayName = 'DialogContent';

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  )
);

DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, className }, ref) => (
    <h2
      ref={ref}
      id="dialog-title"
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    >
      {children}
    </h2>
  )
);

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ children, className }, ref) => (
    <p
      ref={ref}
      id="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  )
);

DialogDescription.displayName = 'DialogDescription';

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}>
      {children}
    </div>
  )
);

DialogFooter.displayName = 'DialogFooter';