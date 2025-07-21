import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilityPanel, AccessibilityToggle, SkipToMain, useScreenReader } from '../accessibility';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  const mockFn = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockFn,
  });

  return mockFn;
};

describe('AccessibilityPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Setup matchMedia mock before each test
    mockMatchMedia(false);

    // Ensure window.matchMedia exists
    if (!window.matchMedia) {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    }
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<AccessibilityPanel {...defaultProps} />);
      
      expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AccessibilityPanel {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Accessibility Settings')).not.toBeInTheDocument();
    });

    it('renders all tab sections', () => {
      render(<AccessibilityPanel {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: 'Display' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Navigation' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Audio' })).toBeInTheDocument();
    });

    it('renders display settings', () => {
      render(<AccessibilityPanel {...defaultProps} />);
      
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      expect(screen.getByText('Large Text')).toBeInTheDocument();
      expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
      expect(screen.getByText('Font Size')).toBeInTheDocument();
      expect(screen.getByText('Color Scheme')).toBeInTheDocument();
    });

    it('renders navigation settings', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);
      
      await user.click(screen.getByRole('tab', { name: 'Navigation' }));
      
      expect(screen.getByText('Focus Indicators')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Navigation')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('renders audio settings', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);
      
      await user.click(screen.getByRole('tab', { name: 'Audio' }));
      
      expect(screen.getByText('Screen Reader Support')).toBeInTheDocument();
      expect(screen.getByText('Screen Reader Features')).toBeInTheDocument();
    });
  });

  describe('Settings Management', () => {
    it('loads settings from localStorage on mount', () => {
      const savedSettings = JSON.stringify({
        highContrast: true,
        largeText: true,
        fontSize: 'large',
      });
      mockLocalStorage.getItem.mockReturnValue(savedSettings);
      
      render(<AccessibilityPanel {...defaultProps} />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('accessibility-settings');
    });

    it('saves settings to localStorage when changed', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      // Find the high contrast toggle button by its text content
      const highContrastButtons = screen.getAllByRole('button', { name: 'Off' });
      const highContrastButton = highContrastButtons[0]; // First "Off" button should be high contrast
      await user.click(highContrastButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'accessibility-settings',
        expect.stringContaining('"highContrast":true')
      );
    });

    it('resets settings to default when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      // First change a setting
      const highContrastButtons = screen.getAllByRole('button', { name: 'Off' });
      const highContrastButton = highContrastButtons[0];
      await user.click(highContrastButton);

      // Then reset
      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        'accessibility-settings',
        expect.stringContaining('"highContrast":false')
      );
    });
  });

  describe('Setting Controls', () => {
    it('toggles high contrast setting', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      const offButtons = screen.getAllByRole('button', { name: 'Off' });
      const highContrastButton = offButtons[0]; // First "Off" button
      await user.click(highContrastButton);

      // After clicking, it should show "On"
      expect(screen.getByRole('button', { name: 'On' })).toBeInTheDocument();
    });

    it('toggles large text setting', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      const offButtons = screen.getAllByRole('button', { name: 'Off' });
      const largeTextButton = offButtons[1]; // Second "Off" button
      await user.click(largeTextButton);

      // After clicking, it should show "On"
      const onButtons = screen.getAllByRole('button', { name: 'On' });
      expect(onButtons.length).toBeGreaterThan(0);
    });

    it('changes font size setting', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);
      
      const largeButton = screen.getByRole('button', { name: 'large' });
      await user.click(largeButton);
      
      expect(largeButton).toHaveClass('bg-primary');
    });

    it('changes color scheme setting', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);
      
      const darkButton = screen.getByRole('button', { name: 'dark' });
      await user.click(darkButton);
      
      expect(darkButton).toHaveClass('bg-primary');
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels', () => {
      render(<AccessibilityPanel {...defaultProps} />);

      // Check for tablist and tabs
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      const firstTab = screen.getByRole('tab', { name: 'Display' });
      expect(firstTab).toBeInTheDocument();

      // Test that tabs are focusable
      await user.click(firstTab);
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('closes on escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<AccessibilityPanel {...defaultProps} onClose={onClose} />);

      // Simulate escape key press on document
      fireEvent.keyDown(document, { key: 'Escape' });

      // The escape handler should trigger close
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('DOM Manipulation', () => {
    beforeEach(() => {
      // Mock document.documentElement
      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
          },
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          style: {
            setProperty: jest.fn(),
            removeProperty: jest.fn(),
          },
        },
        writable: true,
      });
    });

    it('applies high contrast class to document', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      const offButtons = screen.getAllByRole('button', { name: 'Off' });
      const highContrastButton = offButtons[0];
      await user.click(highContrastButton);

      await waitFor(() => {
        expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-high-contrast', 'true');
      });
    });

    it('applies reduced motion styles', async () => {
      const user = userEvent.setup();
      render(<AccessibilityPanel {...defaultProps} />);

      const offButtons = screen.getAllByRole('button', { name: 'Off' });
      const reducedMotionButton = offButtons[2]; // Third "Off" button
      await user.click(reducedMotionButton);

      await waitFor(() => {
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--animation-duration', '0.01ms');
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--transition-duration', '0.01ms');
      });
    });
  });
});

describe('AccessibilityToggle', () => {
  it('renders toggle button', () => {
    render(<AccessibilityToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed', 'bottom-4', 'right-4');
  });

  it('opens accessibility panel when clicked', async () => {
    const user = userEvent.setup();
    render(<AccessibilityToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
  });

  it('closes panel when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccessibilityToggle />);

    // Open panel
    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);

    // Verify panel is open
    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();

    // Close panel by pressing escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Accessibility Settings')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('SkipToMain', () => {
  it('renders skip link', () => {
    render(<SkipToMain />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('has proper accessibility classes', () => {
    render(<SkipToMain />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveClass('sr-only');
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });

  it('becomes visible on focus', async () => {
    const user = userEvent.setup();
    render(<SkipToMain />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    await user.tab();
    
    expect(skipLink).toHaveFocus();
  });
});

describe('useScreenReader', () => {
  it('creates announcement element', () => {
    // Clear any existing announcements
    const existingAnnouncements = document.querySelectorAll('[aria-live]');
    existingAnnouncements.forEach(el => el.remove());

    const TestComponent = () => {
      const { announce } = useScreenReader();

      return (
        <button onClick={() => announce('Test announcement')}>
          Announce
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: 'Announce' });
    fireEvent.click(button);

    // Check if announcement element was created
    const announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveTextContent('Test announcement');
  });

  it('supports assertive announcements', () => {
    const TestComponent = () => {
      const { announce } = useScreenReader();
      
      return (
        <button onClick={() => announce('Urgent announcement', 'assertive')}>
          Announce Urgent
        </button>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByRole('button', { name: 'Announce Urgent' });
    fireEvent.click(button);
    
    const announcement = document.querySelector('[aria-live="assertive"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveTextContent('Urgent announcement');
  });

  it('removes announcement after timeout', async () => {
    jest.useFakeTimers();

    // Clear any existing announcements
    const existingAnnouncements = document.querySelectorAll('[aria-live]');
    existingAnnouncements.forEach(el => el.remove());

    const TestComponent = () => {
      const { announce } = useScreenReader();

      return (
        <button onClick={() => announce('Temporary announcement')}>
          Announce
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByRole('button', { name: 'Announce' });
    fireEvent.click(button);

    // Check announcement exists
    let announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement?.textContent).toBe('Temporary announcement');

    // Fast-forward time to trigger removal
    jest.advanceTimersByTime(1000);

    // Check announcement element is removed
    announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
