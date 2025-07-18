import {
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile,
  getSession,
  getUser,
  onAuthStateChange,
  refreshSession,
} from '../auth'
import { supabase } from '../auth'
import { userFixtures, sessionFixtures } from '@/__tests__/fixtures/test-data'

// Mock the Supabase client
jest.mock('../auth', () => ({
  ...jest.requireActual('../auth'),
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}))

describe('Authentication Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should sign up a new user successfully', async () => {
      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
          session: sessionFixtures.validSession,
        },
        error: null,
      }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue(mockResponse)

      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      }

      const result = await signUp(signUpData)

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when sign up fails', async () => {
      const mockError = new Error('Email already exists')
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const signUpData = {
        email: 'existing@example.com',
        password: 'password123',
      }

      await expect(signUp(signUpData)).rejects.toThrow('Email already exists')
    })

    it('should handle sign up without options', async () => {
      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
          session: null,
        },
        error: null,
      }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue(mockResponse)

      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await signUp(signUpData)

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('signIn', () => {
    it('should sign in an existing user successfully', async () => {
      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
          session: sessionFixtures.validSession,
        },
        error: null,
      }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse)

      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await signIn(signInData)

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when sign in fails', async () => {
      const mockError = new Error('Invalid credentials')
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      await expect(signIn(signInData)).rejects.toThrow('Invalid credentials')
    })

    it('should handle empty credentials', async () => {
      const mockError = new Error('Email is required')
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const signInData = {
        email: '',
        password: '',
      }

      await expect(signIn(signInData)).rejects.toThrow('Email is required')
    })
  })

  describe('signOut', () => {
    it('should sign out the current user successfully', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      })

      await signOut()

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw an error when sign out fails', async () => {
      const mockError = new Error('Sign out failed')
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      })

      await expect(signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      const mockResponse = {
        data: {},
        error: null,
      }

      ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue(mockResponse)

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      })

      const resetData = {
        email: 'test@example.com',
      }

      const result = await resetPassword(resetData)

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password/confirm',
        }
      )

      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when reset password fails', async () => {
      const mockError = new Error('User not found')
      ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const resetData = {
        email: 'nonexistent@example.com',
      }

      await expect(resetPassword(resetData)).rejects.toThrow('User not found')
    })
  })

  describe('updatePassword', () => {
    it('should update user password successfully', async () => {
      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
        },
        error: null,
      }

      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse)

      const updateData = {
        password: 'newpassword123',
      }

      const result = await updatePassword(updateData)

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when password update fails', async () => {
      const mockError = new Error('Password too weak')
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const updateData = {
        password: '123',
      }

      await expect(updatePassword(updateData)).rejects.toThrow('Password too weak')
    })
  })

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            ...userFixtures.basicUser,
            user_metadata: {
              full_name: 'Updated Name',
            },
          },
        },
        error: null,
      }

      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse)

      const updateData = {
        full_name: 'Updated Name',
      }

      const result = await updateProfile(updateData)

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          full_name: 'Updated Name',
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should update multiple profile fields', async () => {
      const mockResponse = {
        data: {
          user: {
            ...userFixtures.basicUser,
            email: 'newemail@example.com',
            user_metadata: {
              full_name: 'New Name',
            },
          },
        },
        error: null,
      }

      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse)

      const updateData = {
        full_name: 'New Name',
        email: 'newemail@example.com',
      }

      const result = await updateProfile(updateData)

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          full_name: 'New Name',
          email: 'newemail@example.com',
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when profile update fails', async () => {
      const mockError = new Error('Update failed')
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const updateData = {
        full_name: 'New Name',
      }

      await expect(updateProfile(updateData)).rejects.toThrow('Update failed')
    })
  })

  describe('getSession', () => {
    it('should get current session successfully', async () => {
      const mockResponse = {
        data: {
          session: sessionFixtures.validSession,
        },
        error: null,
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getSession()

      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(result).toEqual(sessionFixtures.validSession)
    })

    it('should return null when no session exists', async () => {
      const mockResponse = {
        data: {
          session: null,
        },
        error: null,
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should throw an error when getting session fails', async () => {
      const mockError = new Error('Session retrieval failed')
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      await expect(getSession()).rejects.toThrow('Session retrieval failed')
    })
  })

  describe('getUser', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
        },
        error: null,
      }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getUser()

      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(userFixtures.basicUser)
    })

    it('should return null when no user exists', async () => {
      const mockResponse = {
        data: {
          user: null,
        },
        error: null,
      }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getUser()

      expect(result).toBeNull()
    })

    it('should throw an error when getting user fails', async () => {
      const mockError = new Error('User retrieval failed')
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      await expect(getUser()).rejects.toThrow('User retrieval failed')
    })
  })

  describe('onAuthStateChange', () => {
    it('should listen to auth state changes', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()

      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (callback) => {
          // Simulate a sign in event
          callback('SIGNED_IN', sessionFixtures.validSession)
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
        }
      )

      const subscription = onAuthStateChange(mockCallback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(mockCallback).toHaveBeenCalledWith(sessionFixtures.validSession.user)
    })

    it('should handle null session in auth state change', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()

      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (callback) => {
          // Simulate a sign out event
          callback('SIGNED_OUT', null)
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
        }
      )

      const subscription = onAuthStateChange(mockCallback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(mockCallback).toHaveBeenCalledWith(null)
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockResponse = {
        data: {
          session: sessionFixtures.validSession,
          user: userFixtures.basicUser,
        },
        error: null,
      }

      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue(mockResponse)

      const result = await refreshSession()

      expect(supabase.auth.refreshSession).toHaveBeenCalled()
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw an error when refresh fails', async () => {
      const mockError = new Error('Refresh failed')
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      await expect(refreshSession()).rejects.toThrow('Refresh failed')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      }

      await expect(signIn(signInData)).rejects.toThrow('Network error')
    })

    it('should handle timeout errors', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      )

      await expect(getSession()).rejects.toThrow('Request timeout')
    })

    it('should handle malformed responses', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid response format' },
      })

      await expect(getUser()).rejects.toThrow('Invalid response format')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string inputs', async () => {
      const mockError = new Error('Email is required')
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      await expect(signIn({ email: '', password: '' })).rejects.toThrow(
        'Email is required'
      )
    })

    it('should handle very long input values', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com'
      const longPassword = 'b'.repeat(1000)

      const mockError = new Error('Input too long')
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      await expect(
        signUp({ email: longEmail, password: longPassword })
      ).rejects.toThrow('Input too long')
    })

    it('should handle special characters in inputs', async () => {
      const specialEmail = 'test+special@example.com'
      const specialPassword = 'P@ssw0rd!#$%'

      const mockResponse = {
        data: {
          user: userFixtures.basicUser,
          session: sessionFixtures.validSession,
        },
        error: null,
      }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse)

      const result = await signIn({
        email: specialEmail,
        password: specialPassword,
      })

      expect(result).toEqual(mockResponse.data)
    })
  })
})