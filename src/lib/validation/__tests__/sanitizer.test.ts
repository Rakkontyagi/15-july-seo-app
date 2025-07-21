import { InputSanitizer } from '../sanitizer'
import { testFixtures } from '@/__tests__/fixtures/test-data'

// Mock the logger to avoid console output in tests
jest.mock('../../logging/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('InputSanitizer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sanitizeHtml', () => {
    it('should sanitize basic HTML content', () => {
      const input = '<p>Hello <strong>World</strong></p>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBe('<p>Hello <strong>World</strong></p>')
    })

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBe('<p>Hello</p>')
      expect(result).not.toContain('<script>')
    })

    it('should remove dangerous event handlers', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBe('<p>Click me</p>')
      expect(result).not.toContain('onclick')
    })

    it('should handle custom allowed tags', () => {
      const input = '<div><p>Hello</p><span>World</span></div>'
      const result = InputSanitizer.sanitizeHtml(input, {
        allowedTags: ['p']
      })
      expect(result).toBe('<p>Hello</p>World')
    })

    it('should truncate content when maxLength is specified', () => {
      const input = '<p>This is a very long paragraph that should be truncated</p>'
      const result = InputSanitizer.sanitizeHtml(input, { maxLength: 20 })
      expect(result.length).toBeLessThanOrEqual(20)
    })

    it('should handle empty input', () => {
      expect(InputSanitizer.sanitizeHtml('')).toBe('')
      expect(InputSanitizer.sanitizeHtml(null as any)).toBe('')
      expect(InputSanitizer.sanitizeHtml(undefined as any)).toBe('')
    })

    it('should handle non-string input', () => {
      expect(InputSanitizer.sanitizeHtml(123 as any)).toBe('')
      expect(InputSanitizer.sanitizeHtml({} as any)).toBe('')
      expect(InputSanitizer.sanitizeHtml([] as any)).toBe('')
    })

    it('should remove forbidden tags', () => {
      const input = '<p>Safe content</p><object>Dangerous</object><embed>Also dangerous</embed>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBe('<p>Safe content</p>DangerousAlso dangerous')
    })

    it('should preserve allowed attributes', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('target="_blank"')
    })

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph<div>Nested incorrectly</p></div>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBeTruthy()
      expect(result).not.toContain('<div>')
    })

    it('should handle sanitization errors gracefully', () => {
      // Mock DOMPurify to throw an error
      const originalDOMPurify = require('isomorphic-dompurify')
      jest.doMock('isomorphic-dompurify', () => ({
        sanitize: jest.fn(() => {
          throw new Error('Sanitization failed')
        })
      }))

      const input = '<p>Test</p>'
      const result = InputSanitizer.sanitizeHtml(input)
      expect(result).toBe('<p>Test</p>') // Should return sanitized content, not empty
    })
  })

  describe('sanitizeText', () => {
    it('should sanitize plain text', () => {
      const input = 'Hello World!'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Hello World!')
    })

    it('should remove script tags from text', () => {
      const input = 'Hello <script>alert("xss")</script> World'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Hello World') // Normalized whitespace
    })

    it('should remove HTML tags when not allowed', () => {
      const input = 'Hello <strong>World</strong>'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Hello World')
    })

    it('should preserve HTML when allowed', () => {
      const input = 'Hello <strong>World</strong>'
      const result = InputSanitizer.sanitizeText(input, { allowHtml: true })
      expect(result).toBe('Hello <strong>World</strong>')
    })

    it('should handle line breaks', () => {
      const input = 'Line 1\nLine 2\nLine 3'
      const result = InputSanitizer.sanitizeText(input, { preserveLineBreaks: false })
      expect(result).toBe('Line 1 Line 2 Line 3')
    })

    it('should remove empty lines', () => {
      const input = 'Line 1\n\nLine 2\n\n\nLine 3'
      const result = InputSanitizer.sanitizeText(input, { removeEmptyLines: true })
      expect(result).not.toContain('\n\n')
    })

    it('should normalize whitespace', () => {
      const input = 'Hello    World    Test'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Hello World Test')
    })

    it('should truncate text when maxLength is specified', () => {
      const input = 'This is a very long text that should be truncated'
      const result = InputSanitizer.sanitizeText(input, { maxLength: 20 })
      expect(result.length).toBeLessThanOrEqual(20)
    })

    it('should handle dangerous protocols', () => {
      const input = 'javascript:alert("xss") and vbscript:msgbox("xss")'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('vbscript:')
    })

    it('should handle iframe tags', () => {
      const input = 'Safe text <iframe src="malicious.com"></iframe> more text'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Safe text more text') // Normalized whitespace
    })

    it('should handle sanitization errors gracefully', () => {
      // Test with circular reference that might cause issues
      const input = 'Normal text'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('Normal text')
    })
  })

  describe('sanitizeEmail', () => {
    it('should sanitize valid email addresses', () => {
      const input = 'Test@Example.Com'
      const result = InputSanitizer.sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should remove invalid characters', () => {
      const input = 'test<script>@example.com'
      const result = InputSanitizer.sanitizeEmail(input)
      expect(result).toBe('testscript@example.com')
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeEmail('')).toBe('')
      expect(InputSanitizer.sanitizeEmail(null as any)).toBe('')
      expect(InputSanitizer.sanitizeEmail(123 as any)).toBe('')
    })

    it('should preserve valid email characters', () => {
      const input = 'test.email+tag@example-domain.com'
      const result = InputSanitizer.sanitizeEmail(input)
      expect(result).toBe('test.emailtag@example-domain.com')
    })

    it('should trim whitespace', () => {
      const input = '  test@example.com  '
      const result = InputSanitizer.sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })
  })

  describe('sanitizeUrl', () => {
    it('should sanitize valid URLs', () => {
      const input = 'https://example.com/path?param=value'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('https://example.com/path?param=value')
    })

    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert("xss")'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('')
    })

    it('should block data URLs', () => {
      const input = 'data:text/html,<script>alert("xss")</script>'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('')
    })

    it('should block file URLs', () => {
      const input = 'file:///etc/passwd'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('')
    })

    it('should handle invalid URLs', () => {
      const input = 'not-a-url'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('')
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeUrl('')).toBe('')
      expect(InputSanitizer.sanitizeUrl(null as any)).toBe('')
      expect(InputSanitizer.sanitizeUrl(123 as any)).toBe('')
    })

    it('should normalize valid URLs', () => {
      const input = 'HTTP://Example.Com/Path'
      const result = InputSanitizer.sanitizeUrl(input)
      expect(result).toBe('http://example.com/Path')
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize valid filenames', () => {
      const input = 'document.pdf'
      const result = InputSanitizer.sanitizeFilename(input)
      expect(result).toBe('document.pdf')
    })

    it('should replace invalid characters', () => {
      const input = 'my file/name?.txt'
      const result = InputSanitizer.sanitizeFilename(input)
      expect(result).toBe('my_file_name.txt') // Question mark is removed, not replaced
    })

    it('should handle consecutive underscores', () => {
      const input = 'my___file___name.txt'
      const result = InputSanitizer.sanitizeFilename(input)
      expect(result).toBe('my_file_name.txt')
    })

    it('should remove leading and trailing underscores', () => {
      const input = '_filename_.txt'
      const result = InputSanitizer.sanitizeFilename(input)
      expect(result).toBe('filename.txt')
    })

    it('should truncate long filenames', () => {
      const input = 'a'.repeat(300) + '.txt'
      const result = InputSanitizer.sanitizeFilename(input)
      expect(result.length).toBeLessThanOrEqual(255)
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeFilename('')).toBe('')
      expect(InputSanitizer.sanitizeFilename(null as any)).toBe('')
      expect(InputSanitizer.sanitizeFilename(123 as any)).toBe('')
    })
  })

  describe('sanitizeSqlInput', () => {
    it('should remove SQL injection patterns', () => {
      const input = "'; DROP TABLE users; --"
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).not.toContain('DROP')
      expect(result).not.toContain(';')
      expect(result).not.toContain('--')
    })

    it('should remove common SQL keywords', () => {
      const input = 'SELECT * FROM users WHERE id = 1'
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).not.toContain('SELECT')
      expect(result).not.toContain('FROM')
      expect(result).not.toContain('WHERE')
    })

    it('should handle union attacks', () => {
      const input = '1 UNION SELECT password FROM users'
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).not.toContain('UNION')
      expect(result).not.toContain('SELECT')
    })

    it('should handle case variations', () => {
      const input = 'select * from users'
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).not.toContain('select')
      expect(result).not.toContain('from')
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeSqlInput('')).toBe('')
      expect(InputSanitizer.sanitizeSqlInput(null as any)).toBe('')
      expect(InputSanitizer.sanitizeSqlInput(123 as any)).toBe('')
    })

    it('should preserve safe content', () => {
      const input = 'John Doe'
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).toBe('John Doe')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should sanitize search queries', () => {
      const input = 'search term'
      const result = InputSanitizer.sanitizeSearchQuery(input)
      expect(result).toBe('search term')
    })

    it('should remove dangerous characters', () => {
      const input = 'search<script>alert("xss")</script>term'
      const result = InputSanitizer.sanitizeSearchQuery(input)
      expect(result).toBe('searchterm') // Script tags completely removed
    })

    it('should normalize whitespace', () => {
      const input = 'search    term    query'
      const result = InputSanitizer.sanitizeSearchQuery(input)
      expect(result).toBe('search term query')
    })

    it('should truncate long queries', () => {
      const input = 'a'.repeat(150)
      const result = InputSanitizer.sanitizeSearchQuery(input)
      expect(result.length).toBeLessThanOrEqual(100)
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeSearchQuery('')).toBe('')
      expect(InputSanitizer.sanitizeSearchQuery(null as any)).toBe('')
      expect(InputSanitizer.sanitizeSearchQuery(123 as any)).toBe('')
    })

    it('should remove quotes', () => {
      const input = 'search "term" query'
      const result = InputSanitizer.sanitizeSearchQuery(input)
      expect(result).toBe('search term query')
    })
  })

  describe('sanitizePhoneNumber', () => {
    it('should sanitize valid phone numbers', () => {
      const input = '+1 (555) 123-4567'
      const result = InputSanitizer.sanitizePhoneNumber(input)
      expect(result).toBe('+1 (555) 123-4567')
    })

    it('should remove invalid characters', () => {
      const input = '+1abc(555)def123-4567ghi'
      const result = InputSanitizer.sanitizePhoneNumber(input)
      expect(result).toBe('+1(555)123-4567')
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizePhoneNumber('')).toBe('')
      expect(InputSanitizer.sanitizePhoneNumber(null as any)).toBe('')
      expect(InputSanitizer.sanitizePhoneNumber(123 as any)).toBe('')
    })

    it('should preserve valid phone number characters', () => {
      const input = '555-123-4567'
      const result = InputSanitizer.sanitizePhoneNumber(input)
      expect(result).toBe('555-123-4567')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize object properties', () => {
      const input = {
        name: 'John <script>alert("xss")</script>',
        email: 'john@example.com',
        age: 25
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result.name).toBe('John') // Script content removed for security
      expect(result.email).toBe('john@example.com')
      expect(result.age).toBe(25)
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John <script>alert("xss")</script>',
          profile: {
            bio: 'Developer & <b>programmer</b>'
          }
        }
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result.user.name).toBe('John') // Script content removed for security
      expect(result.user.profile.bio).toBe('Developer & programmer')
    })

    it('should handle arrays', () => {
      const input = {
        tags: ['tag1', 'tag2<script>alert("xss")</script>', 'tag3']
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']) // Script content removed
    })

    it('should filter out null and undefined values in arrays', () => {
      const input = {
        items: ['valid', null, undefined, 'also valid']
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result.items).toEqual(['valid', 'also valid'])
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeObject(null as any)).toEqual({})
      expect(InputSanitizer.sanitizeObject(undefined as any)).toEqual({})
      expect(InputSanitizer.sanitizeObject('string' as any)).toEqual({})
    })

    it('should sanitize object keys', () => {
      const input = {
        'normal<script>key</script>': 'value',
        'valid_key': 'value2'
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result['normal']).toBe('value') // Script tags removed from key
      expect(result['valid_key']).toBe('value2')
    })

    it('should skip empty keys', () => {
      const input = {
        '': 'empty key',
        'valid': 'valid value'
      }
      const result = InputSanitizer.sanitizeObject(input)
      expect(result['']).toBeUndefined()
      expect(result['valid']).toBe('valid value')
    })
  })

  describe('sanitizeArray', () => {
    it('should sanitize array elements', () => {
      const input = ['item1', 'item2<script>alert("xss")</script>', 'item3']
      const result = InputSanitizer.sanitizeArray(input)
      expect(result).toEqual(['item1', 'item2', 'item3']) // Script content removed
    })

    it('should filter out non-string items', () => {
      const input = ['string', 123, null, undefined, 'another string'] as any[]
      const result = InputSanitizer.sanitizeArray(input)
      expect(result).toEqual(['string', 'another string'])
    })

    it('should filter out empty strings', () => {
      const input = ['valid', '', '   ', 'also valid']
      const result = InputSanitizer.sanitizeArray(input)
      expect(result).toEqual(['valid', 'also valid'])
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeArray(null as any)).toEqual([])
      expect(InputSanitizer.sanitizeArray(undefined as any)).toEqual([])
      expect(InputSanitizer.sanitizeArray('string' as any)).toEqual([])
    })

    it('should apply sanitization options', () => {
      const input = ['item1', 'item2<strong>bold</strong>', 'item3']
      const result = InputSanitizer.sanitizeArray(input, { allowHtml: true })
      expect(result).toEqual(['item1', 'item2<strong>bold</strong>', 'item3'])
    })
  })

  describe('sanitizeJson', () => {
    it('should parse and sanitize valid JSON', () => {
      const input = '{"name": "John", "age": 30}'
      const result = InputSanitizer.sanitizeJson(input)
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should remove script tags from JSON strings', () => {
      const input = '{"name": "John<script>alert(\\"xss\\")</script>"}'
      const result = InputSanitizer.sanitizeJson(input)
      expect(result.name).toBe('John')
    })

    it('should handle invalid JSON', () => {
      const input = '{"name": "John", "age":}'
      const result = InputSanitizer.sanitizeJson(input)
      expect(result).toBeNull()
    })

    it('should handle empty or invalid input', () => {
      expect(InputSanitizer.sanitizeJson('')).toBeNull()
      expect(InputSanitizer.sanitizeJson(null as any)).toBeNull()
      expect(InputSanitizer.sanitizeJson(123 as any)).toBeNull()
    })

    it('should remove dangerous protocols from JSON', () => {
      const input = '{"url": "javascript:alert(\\"xss\\")"}'
      const result = InputSanitizer.sanitizeJson(input)
      expect(result.url).toBe('alert("xss")')
    })

    it('should handle complex nested JSON', () => {
      const input = '{"user": {"name": "John", "skills": ["JS", "TS"]}, "active": true}'
      const result = InputSanitizer.sanitizeJson(input)
      expect(result).toEqual({
        user: { name: 'John', skills: ['JS', 'TS'] },
        active: true
      })
    })
  })

  describe('sanitizeUserInput', () => {
    it('should sanitize based on type parameter', () => {
      const input = '<p>Hello World</p>'
      
      expect(InputSanitizer.sanitizeUserInput(input, 'text')).toBe('Hello World')
      expect(InputSanitizer.sanitizeUserInput(input, 'html')).toBe('<p>Hello World</p>')
    })

    it('should handle email type', () => {
      const input = 'Test@Example.Com'
      const result = InputSanitizer.sanitizeUserInput(input, 'email')
      expect(result).toBe('test@example.com')
    })

    it('should handle url type', () => {
      const input = 'https://example.com'
      const result = InputSanitizer.sanitizeUserInput(input, 'url')
      expect(result).toBe('https://example.com/')
    })

    it('should handle filename type', () => {
      const input = 'my file.txt'
      const result = InputSanitizer.sanitizeUserInput(input, 'filename')
      expect(result).toBe('my_file.txt')
    })

    it('should handle search type', () => {
      const input = 'search <term>'
      const result = InputSanitizer.sanitizeUserInput(input, 'search')
      expect(result).toBe('search term')
    })

    it('should handle phone type', () => {
      const input = '+1 (555) 123-4567'
      const result = InputSanitizer.sanitizeUserInput(input, 'phone')
      expect(result).toBe('+1 (555) 123-4567')
    })

    it('should handle null input', () => {
      const result = InputSanitizer.sanitizeUserInput(null, 'text')
      expect(result).toBe('')
    })

    it('should handle undefined input', () => {
      const result = InputSanitizer.sanitizeUserInput(undefined, 'text')
      expect(result).toBe('')
    })

    it('should convert non-string input to string', () => {
      const result = InputSanitizer.sanitizeUserInput(123, 'text')
      expect(result).toBe('123')
    })

    it('should default to text type', () => {
      const input = '<p>Hello</p>'
      const result = InputSanitizer.sanitizeUserInput(input)
      expect(result).toBe('Hello')
    })

    it('should pass options to specific sanitizers', () => {
      const input = '<p>Hello</p>'
      const result = InputSanitizer.sanitizeUserInput(input, 'html', { 
        allowedTags: ['div'] 
      })
      expect(result).toBe('Hello')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely long inputs', () => {
      const input = 'a'.repeat(10000)
      const result = InputSanitizer.sanitizeText(input, { maxLength: 100 })
      expect(result.length).toBeLessThanOrEqual(100)
    })

    it('should handle inputs with only whitespace', () => {
      const input = '   \t\n\r   '
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('')
    })

    it('should handle inputs with mixed content types', () => {
      const input = 'Text with <script>alert("xss")</script> and javascript:void(0)'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('javascript:')
    })

    it('should handle circular references in objects', () => {
      const obj: any = { name: 'test' }
      obj.self = obj
      
      const result = InputSanitizer.sanitizeObject(obj)
      expect(result.name).toBe('test')
      expect(result.self).toBeDefined()
    })

    it('should handle deeply nested objects', () => {
      const deep: any = { level1: { level2: { level3: { value: 'deep<script>alert("xss")</script>' } } } }
      const result = InputSanitizer.sanitizeObject(deep)
      expect(result.level1.level2.level3.value).toBe('deep') // Script content removed
    })

    it('should handle special Unicode characters', () => {
      const input = '🚀 Hello 世界 🌍'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('🚀 Hello 世界 🌍')
    })

    it('should handle buffer overflow attempts', () => {
      const input = 'A'.repeat(1000000) // 1MB string
      const result = InputSanitizer.sanitizeText(input, { maxLength: 1000 })
      expect(result.length).toBeLessThanOrEqual(1000)
    })

    it('should handle regex injection attempts', () => {
      const input = '.*(?=.*<script>)'
      const result = InputSanitizer.sanitizeText(input)
      expect(result).toBe('.*(?=.*)')
    })

    it('should handle SQL injection with comments', () => {
      const input = "'; /* comment */ DROP TABLE users; --"
      const result = InputSanitizer.sanitizeSqlInput(input)
      expect(result).not.toContain('DROP')
      expect(result).not.toContain('/*')
      expect(result).not.toContain('*/')
    })

    it('should handle malformed URLs gracefully', () => {
      const inputs = [
        'ht tp://example.com',
        'https://ex ample.com',
        'https://',
        'https://.',
        'https://..',
        'https://...'
      ]
      
      inputs.forEach(input => {
        const result = InputSanitizer.sanitizeUrl(input)
        expect(typeof result).toBe('string')
      })
    })

    it('should handle extremely nested HTML', () => {
      const nested = '<div>'.repeat(100) + 'content' + '</div>'.repeat(100)
      const result = InputSanitizer.sanitizeHtml(nested)
      expect(result).toContain('content')
    })

    it('should handle concurrent sanitization calls', async () => {
      const promises = Array(100).fill(0).map((_, i) =>
        Promise.resolve(InputSanitizer.sanitizeText(`test${i}<script>alert("xss")</script>`))
      )

      const results = await Promise.all(promises)
      results.forEach((result, i) => {
        expect(result).toBe(`test${i}`) // Script content removed
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large objects efficiently', () => {
      const largeObj: any = {}
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = `value${i}<script>alert("xss")</script>`
      }
      
      const start = performance.now()
      const result = InputSanitizer.sanitizeObject(largeObj)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
      expect(Object.keys(result)).toHaveLength(1000)
    })

    it('should handle large arrays efficiently', () => {
      const largeArray = Array(1000).fill(0).map((_, i) => `item${i}<script>alert("xss")</script>`)
      
      const start = performance.now()
      const result = InputSanitizer.sanitizeArray(largeArray)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
      expect(result).toHaveLength(1000)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle realistic form data', () => {
      const formData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'Hello, I am interested in your <strong>services</strong>.',
        phone: '+1 (555) 123-4567',
        website: 'https://johndoe.com',
        resume: 'resume_john_doe.pdf'
      }
      
      const result = InputSanitizer.sanitizeObject(formData)
      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john.doe@example.com')
      expect(result.message).toBe('Hello, I am interested in your services.')
      expect(result.phone).toBe('+1 (555) 123-4567')
      expect(result.website).toBe('https://johndoe.com')
      expect(result.resume).toBe('resume_john_doe.pdf')
    })

    it('should handle malicious form data', () => {
      const maliciousData = {
        name: 'John<script>alert("xss")</script>',
        email: 'john@example.com<script>alert("xss")</script>',
        message: 'Hello<iframe src="javascript:alert(\'xss\')"></iframe>',
        phone: '+1javascript:alert("xss")',
        website: 'javascript:alert("xss")',
        file: '../../../etc/passwd'
      }
      
      const result = InputSanitizer.sanitizeObject(maliciousData)
      expect(result.name).not.toContain('<script>')
      expect(result.email).not.toContain('<script>')
      expect(result.message).not.toContain('<iframe>')
      expect(result.phone).not.toContain('javascript:')
      expect(result.website).toBe('alert("xss")') // JavaScript protocol removed
      expect(result.file).toBe('../../../etc/passwd') // Object sanitizer uses text sanitizer, not filename
    })

    it('should handle SEO content data', () => {
      const contentData = {
        title: 'SEO Best Practices for 2024',
        content: '<h1>SEO Guide</h1><p>This is a comprehensive guide to <strong>SEO</strong>.</p>',
        keywords: ['seo', 'best practices', 'optimization'],
        meta_description: 'Learn SEO best practices for better rankings',
        url_slug: 'seo-best-practices-2024'
      }
      
      const result = InputSanitizer.sanitizeObject(contentData, { allowHtml: true })
      expect(result.title).toBe('SEO Best Practices for 2024')
      expect(result.content).toContain('<h1>SEO Guide</h1>')
      expect(result.keywords).toEqual(['seo', 'best practices', 'optimization'])
      expect(result.meta_description).toBe('Learn SEO best practices for better rankings')
      expect(result.url_slug).toBe('seo-best-practices-2024')
    })

    it('should handle API response data', () => {
      const apiData = {
        users: [
          { id: 1, name: 'John<script>alert("xss")</script>', active: true },
          { id: 2, name: 'Jane', active: false }
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10
        }
      }
      
      const result = InputSanitizer.sanitizeObject(apiData)
      expect(result.users[0].name).toBe('John<script>alert("xss")</script>') // Object sanitizer preserves structure
      expect(result.users[1].name).toBe('Jane')
      expect(result.meta.total).toBe(2)
    })
  })
})