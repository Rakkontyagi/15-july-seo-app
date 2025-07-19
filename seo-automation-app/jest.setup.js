import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
Object.assign(global, {
  TextEncoder,
  TextDecoder,
})

// Mock Next.js Request and Response for API route testing
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = input
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this._json = null
    this.nextUrl = {
      searchParams: new URLSearchParams()
    }
  }

  async json() {
    if (this._json) return this._json
    return JSON.parse(this.body || '{}')
  }

  text() {
    return Promise.resolve(this.body || '')
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }

  text() {
    return Promise.resolve(this.body)
  }
}

// Global test setup - Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      append: jest.fn(),
      delete: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    },
  })
)

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NODE_ENV = 'test'

// Mock problematic modules
jest.mock('natural', () => ({
  SentimentAnalyzer: jest.fn(),
  PorterStemmer: jest.fn(),
  WordTokenizer: jest.fn(),
  NGrams: jest.fn(),
  JaroWinklerDistance: jest.fn(),
  LevenshteinDistance: jest.fn(),
  DiceCoefficient: jest.fn(),
  DoubleMetaphone: jest.fn(),
  SoundEx: jest.fn(),
  Metaphone: jest.fn(),
  NounInflector: jest.fn(),
  PresentVerbInflector: jest.fn(),
  CountInflector: jest.fn(),
  WordNet: jest.fn(),
  BayesClassifier: jest.fn(),
  LogisticRegressionClassifier: jest.fn(),
  KMeans: jest.fn(),
  HierarchicalClustering: jest.fn(),
  LancasterStemmer: jest.fn(),
  AggressiveTokenizer: jest.fn(),
}))

jest.mock('compromise', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sentences: jest.fn(() => ({
      length: 5,
      out: jest.fn(() => ['Sentence 1.', 'Sentence 2.', 'Sentence 3.', 'Sentence 4.', 'Sentence 5.'])
    })),
    match: jest.fn(() => ({
      length: 2,
      out: jest.fn(() => ['word1', 'word2'])
    })),
    nouns: jest.fn(() => ({
      out: jest.fn(() => ['noun1', 'noun2'])
    })),
    verbs: jest.fn(() => ({
      out: jest.fn(() => ['verb1', 'verb2'])
    })),
    adjectives: jest.fn(() => ({
      out: jest.fn(() => ['adj1', 'adj2'])
    })),
    out: jest.fn(() => 'processed text')
  }))
}))

jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((input) => input)
  }
}))

jest.mock('jsdom', () => ({
  JSDOM: jest.fn(() => ({
    window: {
      DOMPurify: {
        sanitize: jest.fn((input) => input)
      }
    }
  }))
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  }),
}))

// Silence console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})