'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils/cn';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function Tabs({ 
  children, 
  defaultValue, 
  value, 
  onValueChange,
  className 
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleTabChange = (tab: string) => {
    if (value === undefined) {
      setActiveTab(tab);
    }
    onValueChange?.(tab);
  };

  const currentTab = value || activeTab;

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className, disabled = false }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-muted hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

// Convenience hook for managing tabs
export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within Tabs');
  }
  return context;
}