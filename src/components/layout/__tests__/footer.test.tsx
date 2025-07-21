import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Footer Component', () => {
  describe('Default Variant', () => {
    it('renders footer with proper role and aria-label', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo', { name: /site footer/i });
      expect(footer).toBeInTheDocument();
    });

    it('renders brand section with logo and description', () => {
      render(<Footer />);
      
      expect(screen.getByText('SEO Generator')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText(/AI-powered SEO content generation platform/)).toBeInTheDocument();
    });

    it('renders quick action buttons', () => {
      render(<Footer />);
      
      expect(screen.getByRole('link', { name: /start creating/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get support/i })).toBeInTheDocument();
    });

    it('renders social media links with proper accessibility', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText('Follow us on Twitter');
      const linkedinLink = screen.getByLabelText('Connect on LinkedIn');
      const githubLink = screen.getByLabelText('View our GitHub');
      
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/seogenerator');
      expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/seogenerator');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/seogenerator');
      
      // Check for external link attributes
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders navigation sections', () => {
      render(<Footer />);
      
      // Product section
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Content Generator' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
      
      // Support section
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Documentation' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Help Center' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact Support' })).toBeInTheDocument();
      
      // Company section
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Careers' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Partners' })).toBeInTheDocument();
    });

    it('renders legal section', () => {
      render(<Footer />);
      
      expect(screen.getByText('Legal')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cookie Policy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'GDPR' })).toBeInTheDocument();
    });

    it('renders bottom section with copyright and compliance badges', () => {
      render(<Footer />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} SEO Generator. All rights reserved.`)).toBeInTheDocument();
      expect(screen.getByText('Made with')).toBeInTheDocument();
      expect(screen.getByText('for content creators')).toBeInTheDocument();
      expect(screen.getByText('SOC 2 Compliant')).toBeInTheDocument();
      expect(screen.getByText('GDPR Ready')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('marks external links properly', () => {
      render(<Footer />);
      
      const statusPageLink = screen.getByRole('link', { name: /status page/i });
      expect(statusPageLink).toHaveAttribute('target', '_blank');
      expect(statusPageLink).toHaveAttribute('rel', 'noopener noreferrer');
      
      // Should have external link icon
      const externalIcon = statusPageLink.querySelector('svg');
      expect(externalIcon).toBeInTheDocument();
    });
  });

  describe('Minimal Variant', () => {
    it('renders minimal footer layout', () => {
      render(<Footer variant="minimal" />);
      
      const footer = screen.getByRole('contentinfo', { name: /site footer/i });
      expect(footer).toBeInTheDocument();
    });

    it('renders only essential elements in minimal variant', () => {
      render(<Footer variant="minimal" />);
      
      expect(screen.getByText('SEO Generator')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} SEO Generator`)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();
    });

    it('does not render full navigation in minimal variant', () => {
      render(<Footer variant="minimal" />);
      
      expect(screen.queryByText('Product')).not.toBeInTheDocument();
      expect(screen.queryByText('Support')).not.toBeInTheDocument();
      expect(screen.queryByText('Company')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /start creating/i })).not.toBeInTheDocument();
    });

    it('uses responsive layout in minimal variant', () => {
      render(<Footer variant="minimal" />);
      
      const container = screen.getByRole('contentinfo').querySelector('.container');
      expect(container).toHaveClass('mx-auto', 'px-4', 'py-6');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading.tagName).toMatch(/^H[3-4]$/);
      });
    });

    it('has proper link accessibility', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        // All links should have accessible names
        expect(link).toHaveAccessibleName();
        
        // External links should have proper attributes
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });

    it('has proper button accessibility', () => {
      render(<Footer />);

      // Footer uses links styled as buttons, not actual button elements
      // Check that all interactive elements have accessible names
      const interactiveElements = screen.getAllByRole('link');
      interactiveElements.forEach(element => {
        expect(element).toHaveAccessibleName();
      });
    });

    it('has proper focus management', () => {
      render(<Footer />);
      
      const focusableElements = screen.getAllByRole('link');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('href');
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<Footer />);
      
      const gridContainer = screen.getByRole('contentinfo').querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-5'
      );
    });

    it('applies responsive spacing', () => {
      render(<Footer />);
      
      const container = screen.getByRole('contentinfo').querySelector('.container');
      expect(container).toHaveClass('mx-auto', 'px-4', 'py-12');
    });

    it('handles responsive text layout', () => {
      render(<Footer />);

      const bottomSection = screen.getByText(/© \d{4} SEO Generator/).parentElement?.parentElement;
      expect(bottomSection).toHaveClass(
        'flex',
        'flex-col',
        'md:flex-row',
        'items-center',
        'justify-between'
      );
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Footer className="custom-footer-class" />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('custom-footer-class');
    });

    it('merges custom className with default classes', () => {
      render(<Footer className="custom-class" />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass(
        'custom-class',
        'border-t',
        'bg-background/95',
        'backdrop-blur'
      );
    });
  });

  describe('Content Validation', () => {
    it('displays current year dynamically', () => {
      render(<Footer />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('has valid href attributes for all links', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      });
    });

    it('has proper icon associations', () => {
      render(<Footer />);
      
      // Social links should have icons
      const socialLinks = [
        screen.getByLabelText('Follow us on Twitter'),
        screen.getByLabelText('Connect on LinkedIn'),
        screen.getByLabelText('View our GitHub'),
      ];
      
      socialLinks.forEach(link => {
        const icon = link.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });
});
