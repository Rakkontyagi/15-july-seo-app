import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../auth-provider'
import { useAuthStore } from '@/store/auth'
import { userFixtures } from '@/__tests__/fixtures/test-data'

// Mock the auth store
jest.mock('@/store/auth')

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('AuthProvider', () => {
  const mockInitialize = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize,
    })
  })

  it('should render children', () => {
    render(
      <AuthProvider>
        <div data-testid="child-component">Test Content</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should call initialize on mount', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('should only call initialize once on multiple renders', () => {
    const { rerender } = render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    expect(mockInitialize).toHaveBeenCalledTimes(1)

    rerender(
      <AuthProvider>
        <div>Updated Content</div>
      </AuthProvider>
    )

    // Should still only be called once due to useEffect dependency
    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('should handle initialize function changing', () => {
    const mockInitialize2 = jest.fn()
    
    const { rerender } = render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    expect(mockInitialize).toHaveBeenCalledTimes(1)

    // Mock the store to return a different initialize function
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize2,
    })

    rerender(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    // Should call the new initialize function
    expect(mockInitialize2).toHaveBeenCalledTimes(1)
  })

  it('should handle async initialize', async () => {
    const mockAsyncInitialize = jest.fn().mockResolvedValue(undefined)
    
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockAsyncInitialize,
    })

    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockAsyncInitialize).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle initialize errors gracefully', async () => {
    const mockErrorInitialize = jest.fn().mockRejectedValue(new Error('Init failed'))
    
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockErrorInitialize,
    })

    // Mock console.error to avoid error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockErrorInitialize).toHaveBeenCalledTimes(1)
    })

    // Component should still render even if initialize fails
    expect(screen.getByText('Test Content')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should work with nested providers', () => {
    render(
      <AuthProvider>
        <AuthProvider>
          <div data-testid="nested-content">Nested Content</div>
        </AuthProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('nested-content')).toBeInTheDocument()
    expect(mockInitialize).toHaveBeenCalledTimes(2) // Each provider calls initialize
  })

  it('should handle unmounting', () => {
    const { unmount } = render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    expect(mockInitialize).toHaveBeenCalledTimes(1)

    unmount()

    // Should not cause any errors
    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('should provide access to auth store', () => {
    const TestComponent = () => {
      const { user, loading } = useAuthStore()
      
      return (
        <div>
          <div data-testid="user-status">
            {user ? `User: ${user.email}` : 'No user'}
          </div>
          <div data-testid="loading-status">
            {loading ? 'Loading...' : 'Not loading'}
          </div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-status')).toHaveTextContent('No user')
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
  })

  it('should handle user state changes', () => {
    const TestComponent = () => {
      const { user } = useAuthStore()
      
      return (
        <div data-testid="user-display">
          {user ? user.email : 'No user'}
        </div>
      )
    }

    // Start with no user
    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize,
    })

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-display')).toHaveTextContent('No user')

    // Update to have user
    mockUseAuthStore.mockReturnValue({
      user: userFixtures.basicUser,
      loading: false,
      initialized: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize,
    })

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-display')).toHaveTextContent(userFixtures.basicUser.email)
  })

  it('should handle error states', () => {
    const TestComponent = () => {
      const { error } = useAuthStore()
      
      return (
        <div data-testid="error-display">
          {error ? `Error: ${error}` : 'No error'}
        </div>
      )
    }

    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: false,
      initialized: false,
      error: 'Authentication failed',
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('error-display')).toHaveTextContent('Error: Authentication failed')
  })

  it('should handle loading states', () => {
    const TestComponent = () => {
      const { loading } = useAuthStore()
      
      return (
        <div data-testid="loading-display">
          {loading ? 'Loading...' : 'Ready'}
        </div>
      )
    }

    mockUseAuthStore.mockReturnValue({
      user: null,
      loading: true,
      initialized: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      initialize: mockInitialize,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading-display')).toHaveTextContent('Loading...')
  })

  it('should handle multiple children', () => {
    render(
      <AuthProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <div data-testid="child3">Child 3</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('child1')).toBeInTheDocument()
    expect(screen.getByTestId('child2')).toBeInTheDocument()
    expect(screen.getByTestId('child3')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    render(<AuthProvider>{null}</AuthProvider>)

    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('should handle React fragments', () => {
    render(
      <AuthProvider>
        <>
          <div data-testid="fragment-child1">Fragment Child 1</div>
          <div data-testid="fragment-child2">Fragment Child 2</div>
        </>
      </AuthProvider>
    )

    expect(screen.getByTestId('fragment-child1')).toBeInTheDocument()
    expect(screen.getByTestId('fragment-child2')).toBeInTheDocument()
    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })
})