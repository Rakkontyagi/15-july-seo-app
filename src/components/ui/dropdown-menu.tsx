'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownMenu({ 
  trigger, 
  children, 
  className, 
  contentClassName,
  side = 'bottom',
  align = 'start'
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;

    // Calculate position based on side
    switch (side) {
      case 'top':
        y = triggerRect.top - contentRect.height - 8;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top;
        break;
      case 'bottom':
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - contentRect.width - 8;
        y = triggerRect.top;
        break;
    }

    // Calculate alignment
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left;
          break;
        case 'center':
          x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          break;
        case 'end':
          x = triggerRect.right - contentRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          y = triggerRect.top;
          break;
        case 'center':
          y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          break;
        case 'end':
          y = triggerRect.bottom - contentRect.height;
          break;
      }
    }

    // Ensure dropdown stays within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (x < 8) x = 8;
    if (x + contentRect.width > viewport.width - 8) {
      x = viewport.width - contentRect.width - 8;
    }
    if (y < 8) y = 8;
    if (y + contentRect.height > viewport.height - 8) {
      y = viewport.height - contentRect.height - 8;
    }

    setPosition({ x, y });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, side, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={contentRef}
          className="fixed z-50"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div
            className={cn(
              'min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className, 
  disabled = false,
  icon,
  shortcut
}: DropdownMenuItemProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto text-xs tracking-widest opacity-60">
          {shortcut}
        </span>
      )}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('h-px bg-border my-1', className)} />;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  className,
  disabled = false
}: DropdownMenuCheckboxItemProps) {
  return (
    <div
      onClick={disabled ? undefined : () => onCheckedChange?.(!checked)}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
    >
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}