import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from '../auth'
import { userFixtures, sessionFixtures } from '@/__tests__/fixtures/test-data'
import * as authModule from '@/lib/supabase/auth'

// Mock the auth module
jest.mock('@/lib/supabase/auth')

const mockAuthModule = authModule as jest.Mocked<typeof authModule>

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      loading: false,
      initialized: false,
      error: null,
    })
    
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockSignInResponse = {
        user: userFixtures.basicUser,
        session: sessionFixtures.validSession,
      }

      mockAuthModule.signIn.mockResolvedValue(mockSignInResponse)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockAuthModule.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.current.user).toEqual(userFixtures.basicUser)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle sign in failure', async () => {
      const mockError = new Error('Invalid credentials')
      mockAuthModule.signIn.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        try {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should set loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })

      mockAuthModule.signIn.mockReturnValue(signInPromise)

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()

      await act(async () => {
        resolveSignIn!({
          user: userFixtures.basicUser,
          session: sessionFixtures.validSession,
        })
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockSignUpResponse = {
        user: userFixtures.basicUser,
        session: sessionFixtures.validSession,
      }

      mockAuthModule.signUp.mockResolvedValue(mockSignUpResponse)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.signUp({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Test User',
            },
          },
        })
      })

      expect(mockAuthModule.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })

      expect(result.current.user).toEqual(userFixtures.basicUser)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle sign up failure', async () => {
      const mockError = new Error('Email already exists')
      mockAuthModule.signUp.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'existing@example.com',
            password: 'password123',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Email already exists')
    })

    it('should handle non-Error objects', async () => {
      const mockError = 'String error'
      mockAuthModule.signUp.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'test@example.com',
            password: 'password123',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Sign up failed')
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockAuthModule.signOut.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser(userFixtures.basicUser)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockAuthModule.signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle sign out failure', async () => {
      const mockError = new Error('Sign out failed')
      mockAuthModule.signOut.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser(userFixtures.basicUser)
      })

      await act(async () => {
        try {
          await result.current.signOut()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toEqual(userFixtures.basicUser)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Sign out failed')
    })
  })

  describe('State Setters', () => {
    it('should set user', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(userFixtures.basicUser)
      })

      expect(result.current.user).toEqual(userFixtures.basicUser)
    })

    it('should set loading', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)
    })

    it('should set error', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('initialize', () => {
    it('should initialize successfully with user', async () => {
      mockAuthModule.getUser.mockResolvedValue(userFixtures.basicUser)
      mockAuthModule.onAuthStateChange.mockImplementation((callback) => {
        callback(userFixtures.basicUser)
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.initialize()
      })

      expect(mockAuthModule.getUser).toHaveBeenCalled()
      expect(mockAuthModule.onAuthStateChange).toHaveBeenCalled()
      expect(result.current.user).toEqual(userFixtures.basicUser)
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(true)
    })

    it('should initialize successfully without user', async () => {
      mockAuthModule.getUser.mockResolvedValue(null)
      mockAuthModule.onAuthStateChange.mockImplementation((callback) => {
        callback(null)
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.initialize()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(true)
    })

    it('should handle initialization failure', async () => {
      const mockError = new Error('Initialization failed')
      mockAuthModule.getUser.mockRejectedValue(mockError)

      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.initialize()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Auth initialization failed:', mockError)
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should set loading during initialization', async () => {
      let resolveGetUser: (value: any) => void
      const getUserPromise = new Promise(resolve => {
        resolveGetUser = resolve
      })

      mockAuthModule.getUser.mockReturnValue(getUserPromise)
      mockAuthModule.onAuthStateChange.mockImplementation((callback) => {
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.initialized).toBe(false)

      await act(async () => {
        resolveGetUser!(userFixtures.basicUser)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(true)
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state changes from listener', async () => {
      let authStateCallback: (user: any) => void

      mockAuthModule.getUser.mockResolvedValue(null)
      mockAuthModule.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.initialize()
      })

      // Simulate user sign in via auth state change
      act(() => {
        authStateCallback!(userFixtures.basicUser)
      })

      expect(result.current.user).toEqual(userFixtures.basicUser)

      // Simulate user sign out via auth state change
      act(() => {
        authStateCallback!(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('Concurrency', () => {
    it('should handle concurrent sign in attempts', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })

      mockAuthModule.signIn.mockReturnValue(signInPromise)

      const { result } = renderHook(() => useAuthStore())

      // Start two concurrent sign in attempts
      const promise1 = act(async () => {
        await result.current.signIn({
          email: 'test1@example.com',
          password: 'password123',
        })
      })

      const promise2 = act(async () => {
        await result.current.signIn({
          email: 'test2@example.com',
          password: 'password123',
        })
      })

      await act(async () => {
        resolveSignIn!({
          user: userFixtures.basicUser,
          session: sessionFixtures.validSession,
        })
      })

      await Promise.all([promise1, promise2])

      expect(result.current.user).toEqual(userFixtures.basicUser)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from error state', async () => {
      const mockError = new Error('Initial error')
      mockAuthModule.signIn.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuthStore())

      // First sign in fails
      await act(async () => {
        try {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Initial error')

      // Second sign in succeeds
      mockAuthModule.signIn.mockResolvedValueOnce({
        user: userFixtures.basicUser,
        session: sessionFixtures.validSession,
      })

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'correctpassword',
        })
      })

      expect(result.current.error).toBeNull()
      expect(result.current.user).toEqual(userFixtures.basicUser)
    })
  })
})