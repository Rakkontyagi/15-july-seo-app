import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeSection: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      activeSection: 'dashboard',
      breadcrumbs: [],
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      
      setActiveSection: (section) => set({ activeSection: section }),
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      resetNavigation: () => set({
        sidebarCollapsed: false,
        mobileMenuOpen: false,
        activeSection: 'dashboard',
        breadcrumbs: [],
      }),
    }),
    {
      name: 'navigation-store',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        activeSection: state.activeSection,
      }),
    }
  )
);