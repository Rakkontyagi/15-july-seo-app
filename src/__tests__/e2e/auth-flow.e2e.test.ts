/**
 * End-to-End Tests for Authentication Flow
 * Tests complete user authentication journey
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('User Registration', () => {
    test('should allow new user registration', async () => {
      // Navigate to registration page
      await page.click('[data-testid="register-link"]');
      await expect(page).toHaveURL('/auth/register');

      // Fill registration form
      await page.fill('[data-testid="email-input"]', 'newuser@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="name-input"]', 'New User');

      // Submit form
      await page.click('[data-testid="register-button"]');

      // Should redirect to dashboard or email verification
      await expect(page).toHaveURL(/\/(dashboard|auth\/verify-email)/);
      
      // Check for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should validate registration form fields', async () => {
      await page.goto('/auth/register');

      // Test email validation
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.blur('[data-testid="email-input"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');

      // Test password validation
      await page.fill('[data-testid="password-input"]', 'weak');
      await page.blur('[data-testid="password-input"]');
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

      // Test password confirmation
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass123!');
      await page.blur('[data-testid="confirm-password-input"]');
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('match');
    });

    test('should handle registration errors', async () => {
      await page.goto('/auth/register');

      // Try to register with existing email
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="name-input"]', 'Existing User');

      await page.click('[data-testid="register-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists');
    });
  });

  test.describe('User Login', () => {
    test('should allow user login with valid credentials', async () => {
      await page.goto('/auth/login');

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');

      // Submit form
      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Check for user menu or profile indicator
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should reject invalid credentials', async () => {
      await page.goto('/auth/login');

      // Try invalid credentials
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword');

      await page.click('[data-testid="login-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
      
      // Should stay on login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('should validate login form fields', async () => {
      await page.goto('/auth/login');

      // Test empty form submission
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('required');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('required');

      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.blur('[data-testid="email-input"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
    });

    test('should handle "Remember Me" functionality', async () => {
      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.check('[data-testid="remember-me-checkbox"]');

      await page.click('[data-testid="login-button"]');

      // Check that remember me preference is stored
      const rememberMe = await page.evaluate(() => localStorage.getItem('rememberMe'));
      expect(rememberMe).toBe('true');
    });
  });

  test.describe('Password Reset', () => {
    test('should allow password reset request', async () => {
      await page.goto('/auth/login');
      await page.click('[data-testid="forgot-password-link"]');

      await expect(page).toHaveURL('/auth/forgot-password');

      // Fill email for password reset
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.click('[data-testid="reset-password-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('reset link sent');
    });

    test('should validate email for password reset', async () => {
      await page.goto('/auth/forgot-password');

      // Test invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="reset-password-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
    });

    test('should handle password reset with token', async () => {
      // Simulate clicking reset link with token
      await page.goto('/auth/reset-password?token=valid-reset-token');

      // Fill new password
      await page.fill('[data-testid="password-input"]', 'NewSecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePass123!');

      await page.click('[data-testid="update-password-button"]');

      // Should redirect to login with success message
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password updated');
    });
  });

  test.describe('User Logout', () => {
    test('should allow user logout', async () => {
      // First login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Then logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should not have access to protected routes
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/auth/login');
    });

    test('should clear session data on logout', async () => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="login-button"]');

      // Check session exists
      const sessionBefore = await page.evaluate(() => localStorage.getItem('session'));
      expect(sessionBefore).toBeTruthy();

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Check session is cleared
      const sessionAfter = await page.evaluate(() => localStorage.getItem('session'));
      expect(sessionAfter).toBeNull();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async () => {
      const protectedRoutes = ['/dashboard', '/projects', '/stories', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/auth/login');
      }
    });

    test('should allow authenticated users to access protected routes', async () => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="login-button"]');

      // Test access to protected routes
      const protectedRoutes = ['/dashboard', '/projects', '/stories', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async () => {
      // Login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Refresh page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle expired sessions', async () => {
      // Login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="login-button"]');

      // Simulate expired session by clearing token
      await page.evaluate(() => {
        localStorage.setItem('session', JSON.stringify({
          token: 'expired-token',
          expiresAt: Date.now() - 1000 // Expired 1 second ago
        }));
      });

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Session expired');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();

      // Submit form with Enter
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL('/dashboard');
    });

    test('should have proper ARIA labels and roles', async () => {
      await page.goto('/auth/login');

      // Check form has proper labels
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();

      // Check error messages have proper ARIA attributes
      await page.fill('[data-testid="email-input"]', 'invalid');
      await page.blur('[data-testid="email-input"]');

      const emailError = page.locator('[data-testid="email-error"]');
      await expect(emailError).toHaveAttribute('role', 'alert');
      await expect(emailError).toHaveAttribute('aria-live', 'polite');
    });
  });
});
