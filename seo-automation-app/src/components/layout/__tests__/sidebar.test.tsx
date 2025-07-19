import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../sidebar';
import { useNavigationStore } from '@/store/navigation';
import { useAuthStore } from '@/store/auth';

// Mock the stores
jest.mock('@/store/navigation');
jest.mock('@/store/auth');

// Mock Supabase
jest.mock('@/lib/supabase/auth', () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

const mockNavigationStore = {
  sidebarCollapsed: false,
  activeSection: 'dashboard',
  toggleSidebar: jest.fn(),
  setActiveSection: jest.fn(),
};

const mockAuthStore = {
  user: { email: 'test@example.com' },
  signOut: jest.fn(),
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    (useNavigationStore as jest.Mock).mockReturnValue(mockNavigationStore);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sidebar with navigation items', () => {
      render(<Sidebar />);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content Generator')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('renders secondary navigation', () => {
      render(<Sidebar />);
      
      expect(screen.getByRole('navigation', { name: /secondary navigation/i })).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });

    it('renders user section when user is present', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('renders brand header', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('SEO Generator')).toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    beforeEach(() => {
      (useNavigationStore as jest.Mock).mockReturnValue({
        ...mockNavigationStore,
        sidebarCollapsed: true,
      });
    });

    it('hides text content when collapsed', () => {
      render(<Sidebar />);
      
      // Brand text should be hidden
      expect(screen.queryByText('SEO Generator')).not.toBeInTheDocument();
      
      // Navigation descriptions should be hidden
      expect(screen.queryByText('Overview and quick actions')).not.toBeInTheDocument();
      expect(screen.queryByText('AI-powered content creation')).not.toBeInTheDocument();
    });

    it('shows tooltips for navigation items when collapsed', () => {
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('title', 'Dashboard');
    });

    it('adjusts sign out button layout when collapsed', () => {
      render(<Sidebar />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toHaveClass('justify-center');
    });
  });

  describe('Interactions', () => {
    it('toggles sidebar when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);
      
      expect(mockNavigationStore.toggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('calls signOut when sign out button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);
      
      expect(mockAuthStore.signOut).toHaveBeenCalledTimes(1);
    });

    it('handles sign out errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuthStore.signOut.mockRejectedValueOnce(new Error('Sign out failed'));
      
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Sidebar />);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /secondary navigation/i })).toBeInTheDocument();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('marks active navigation item with aria-current', () => {
      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.tab();
      
      expect(toggleButton).toHaveFocus();
    });

    it('has proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      
      // Tab through navigation items
      await user.tab(); // Toggle button
      await user.tab(); // First nav item
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveFocus();
    });

    it('has aria-hidden for decorative icons', () => {
      render(<Sidebar />);

      // SVG icons should have aria-hidden attribute
      const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgIcons.length).toBeGreaterThan(0);

      svgIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive classes correctly', () => {
      render(<Sidebar />);

      const sidebar = screen.getByRole('navigation', { name: /main navigation/i });
      expect(sidebar).toHaveClass('hidden', 'md:flex');
    });

    it('adjusts width based on collapsed state', () => {
      const { rerender } = render(<Sidebar />);

      let sidebar = screen.getByRole('navigation', { name: /main navigation/i });
      expect(sidebar).toHaveClass('w-64', 'lg:w-72');

      (useNavigationStore as jest.Mock).mockReturnValue({
        ...mockNavigationStore,
        sidebarCollapsed: true,
      });

      rerender(<Sidebar />);

      sidebar = screen.getByRole('navigation', { name: /main navigation/i });
      expect(sidebar).toHaveClass('w-16');
    });
  });

  describe('Badge Display', () => {
    it('shows badges for appropriate navigation items', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('hides badges when sidebar is collapsed', () => {
      (useNavigationStore as jest.Mock).mockReturnValue({
        ...mockNavigationStore,
        sidebarCollapsed: true,
      });
      
      render(<Sidebar />);
      
      expect(screen.queryByText('AI')).not.toBeInTheDocument();
      expect(screen.queryByText('Pro')).not.toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('shows user avatar with first letter of email', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of test@example.com
    });

    it('hides user info when sidebar is collapsed', () => {
      (useNavigationStore as jest.Mock).mockReturnValue({
        ...mockNavigationStore,
        sidebarCollapsed: true,
      });
      
      render(<Sidebar />);
      
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
    });

    it('handles missing user gracefully', () => {
      (useAuthStore as jest.Mock).mockReturnValue({
        ...mockAuthStore,
        user: null,
      });
      
      render(<Sidebar />);
      
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });
  });
});
