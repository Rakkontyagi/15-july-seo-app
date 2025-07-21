import { z } from 'zod'
import {
  validationSchemas,
  validateSchema,
  baseSchemas,
  authSchemas,
  contentSchemas,
  userSchemas,
  apiSchemas,
  fileSchemas,
  webhookSchemas,
  type LoginSchema,
  type RegisterSchema,
  type GenerateContentSchema,
  type UpdateContentSchema,
  type UpdateProfileSchema,
  type PaginationSchema,
  type SearchSchema,
  type FileUploadSchema,
} from '../schemas'

describe('Validation Schemas', () => {
  describe('baseSchemas', () => {
    describe('email', () => {
      it('should validate correct email addresses', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ]

        validEmails.forEach(email => {
          expect(() => baseSchemas.email.parse(email)).not.toThrow()
        })
      })

      it('should reject invalid email addresses', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test..test@example.com',
          'test@example',
          'test@.com',
          'test@example.',
          ''
        ]

        invalidEmails.forEach(email => {
          expect(() => baseSchemas.email.parse(email)).toThrow()
        })
      })
    })

    describe('password', () => {
      it('should validate strong passwords', () => {
        const validPasswords = [
          'Password123!',
          'MyStr0ng@Pass',
          'C0mplex$ecret',
          'S3cur3P@ssw0rd'
        ]

        validPasswords.forEach(password => {
          expect(() => baseSchemas.password.parse(password)).not.toThrow()
        })
      })

      it('should reject weak passwords', () => {
        const invalidPasswords = [
          'password', // no uppercase, number, special char
          'PASSWORD', // no lowercase, number, special char
          'Password', // no number, special char
          'Pass123', // too short
          'password123', // no uppercase, special char
          'PASSWORD123', // no lowercase, special char
          'Password!', // no number
          'a'.repeat(129), // too long
          ''
        ]

        invalidPasswords.forEach(password => {
          expect(() => baseSchemas.password.parse(password)).toThrow()
        })
      })
    })

    describe('url', () => {
      it('should validate correct URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://example.com',
          'https://subdomain.example.com',
          'https://example.com/path',
          'https://example.com/path?query=value',
          'https://example.com:8080'
        ]

        validUrls.forEach(url => {
          expect(() => baseSchemas.url.parse(url)).not.toThrow()
        })
      })

      it('should reject invalid URLs', () => {
        const invalidUrls = [
          'ftp://example.com',
          'javascript:alert("xss")',
          'example.com',
          'https://',
          'http://.',
          'not-a-url',
          ''
        ]

        invalidUrls.forEach(url => {
          expect(() => baseSchemas.url.parse(url)).toThrow()
        })
      })
    })

    describe('keyword', () => {
      it('should validate acceptable keywords', () => {
        const validKeywords = [
          'seo optimization',
          'digital marketing',
          'content strategy',
          'keyword research',
          'SEO best practices',
          'on-page SEO',
          'content marketing 2024'
        ]

        validKeywords.forEach(keyword => {
          expect(() => baseSchemas.keyword.parse(keyword)).not.toThrow()
        })
      })

      it('should reject invalid keywords', () => {
        const invalidKeywords = [
          '',
          'a'.repeat(101), // too long
          'keyword<script>',
          'keyword{malicious}',
          'keyword[injection]',
          'keyword|pipe',
          'keyword&amp;'
        ]

        invalidKeywords.forEach(keyword => {
          expect(() => baseSchemas.keyword.parse(keyword)).toThrow()
        })
      })
    })

    describe('positiveInteger', () => {
      it('should validate positive integers', () => {
        const validNumbers = [1, 2, 10, 100, 1000]

        validNumbers.forEach(num => {
          expect(() => baseSchemas.positiveInteger.parse(num)).not.toThrow()
        })
      })

      it('should reject non-positive integers', () => {
        const invalidNumbers = [0, -1, -100, 3.14, 'not-a-number']

        invalidNumbers.forEach(num => {
          expect(() => baseSchemas.positiveInteger.parse(num)).toThrow()
        })
      })
    })

    describe('uuid', () => {
      it('should validate correct UUIDs', () => {
        const validUuids = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '00000000-0000-0000-0000-000000000000'
        ]

        validUuids.forEach(uuid => {
          expect(() => baseSchemas.uuid.parse(uuid)).not.toThrow()
        })
      })

      it('should reject invalid UUIDs', () => {
        const invalidUuids = [
          'not-a-uuid',
          '123',
          '550e8400-e29b-41d4-a716-44665544000', // too short
          '550e8400-e29b-41d4-a716-4466554400000', // too long
          '550e8400-e29b-41d4-a716-44665544000g', // invalid character
          ''
        ]

        invalidUuids.forEach(uuid => {
          expect(() => baseSchemas.uuid.parse(uuid)).toThrow()
        })
      })
    })

    describe('slug', () => {
      it('should validate correct slugs', () => {
        const validSlugs = [
          'seo-best-practices',
          'content-marketing-2024',
          'keyword-research-tools',
          'on-page-seo',
          'digital-marketing-strategy'
        ]

        validSlugs.forEach(slug => {
          expect(() => baseSchemas.slug.parse(slug)).not.toThrow()
        })
      })

      it('should reject invalid slugs', () => {
        const invalidSlugs = [
          '',
          'SEO Best Practices', // uppercase and spaces
          'seo_best_practices', // underscores
          'seo.best.practices', // dots
          'seo@best@practices', // special chars
          'a'.repeat(101), // too long
          'seo-best-practices-', // trailing dash
          '-seo-best-practices' // leading dash
        ]

        invalidSlugs.forEach(slug => {
          expect(() => baseSchemas.slug.parse(slug)).toThrow()
        })
      })
    })
  })

  describe('authSchemas', () => {
    describe('login', () => {
      it('should validate correct login data', () => {
        const validLogin: LoginSchema = {
          email: 'test@example.com',
          password: 'any-password',
          rememberMe: false
        }

        expect(() => authSchemas.login.parse(validLogin)).not.toThrow()
      })

      it('should apply default values', () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password'
        }

        const result = authSchemas.login.parse(loginData)
        expect(result.rememberMe).toBe(false)
      })

      it('should reject invalid login data', () => {
        const invalidLogins = [
          { email: 'invalid-email', password: 'password' },
          { email: 'test@example.com', password: '' },
          { email: '', password: 'password' },
          {}
        ]

        invalidLogins.forEach(login => {
          expect(() => authSchemas.login.parse(login)).toThrow()
        })
      })
    })

    describe('register', () => {
      it('should validate correct registration data', () => {
        const validRegistration: RegisterSchema = {
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          acceptTerms: true
        }

        expect(() => authSchemas.register.parse(validRegistration)).not.toThrow()
      })

      it('should reject mismatched passwords', () => {
        const invalidRegistration = {
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          acceptTerms: true
        }

        expect(() => authSchemas.register.parse(invalidRegistration)).toThrow()
      })

      it('should reject when terms are not accepted', () => {
        const invalidRegistration = {
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          acceptTerms: false
        }

        expect(() => authSchemas.register.parse(invalidRegistration)).toThrow()
      })

      it('should reject invalid names', () => {
        const invalidNames = [
          { firstName: 'John123', lastName: 'Doe' },
          { firstName: 'John', lastName: 'Doe!' },
          { firstName: '', lastName: 'Doe' },
          { firstName: 'John', lastName: '' },
          { firstName: 'a'.repeat(51), lastName: 'Doe' }
        ]

        invalidNames.forEach(names => {
          const registration = {
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            acceptTerms: true,
            ...names
          }

          expect(() => authSchemas.register.parse(registration)).toThrow()
        })
      })
    })

    describe('forgotPassword', () => {
      it('should validate correct forgot password data', () => {
        const validData = { email: 'test@example.com' }
        expect(() => authSchemas.forgotPassword.parse(validData)).not.toThrow()
      })

      it('should reject invalid email', () => {
        const invalidData = { email: 'invalid-email' }
        expect(() => authSchemas.forgotPassword.parse(invalidData)).toThrow()
      })
    })

    describe('resetPassword', () => {
      it('should validate correct reset password data', () => {
        const validData = {
          token: 'reset-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        }

        expect(() => authSchemas.resetPassword.parse(validData)).not.toThrow()
      })

      it('should reject mismatched passwords', () => {
        const invalidData = {
          token: 'reset-token',
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        }

        expect(() => authSchemas.resetPassword.parse(invalidData)).toThrow()
      })
    })

    describe('changePassword', () => {
      it('should validate correct change password data', () => {
        const validData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        }

        expect(() => authSchemas.changePassword.parse(validData)).not.toThrow()
      })

      it('should reject mismatched new passwords', () => {
        const invalidData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        }

        expect(() => authSchemas.changePassword.parse(invalidData)).toThrow()
      })
    })
  })

  describe('contentSchemas', () => {
    describe('generateContent', () => {
      it('should validate correct content generation data', () => {
        const validData: GenerateContentSchema = {
          keyword: 'seo optimization',
          location: 'United States',
          wordCount: 1500,
          tone: 'professional',
          includeImages: false,
          targetAudience: 'Digital marketers',
          additionalInstructions: 'Focus on 2024 trends'
        }

        expect(() => contentSchemas.generateContent.parse(validData)).not.toThrow()
      })

      it('should apply default values', () => {
        const minimalData = {
          keyword: 'seo optimization',
          location: 'United States'
        }

        const result = contentSchemas.generateContent.parse(minimalData)
        expect(result.wordCount).toBe(1000)
        expect(result.tone).toBe('professional')
        expect(result.includeImages).toBe(false)
      })

      it('should reject invalid word counts', () => {
        const invalidData = {
          keyword: 'seo optimization',
          location: 'United States',
          wordCount: 100 // too low
        }

        expect(() => contentSchemas.generateContent.parse(invalidData)).toThrow()
      })

      it('should reject invalid tone', () => {
        const invalidData = {
          keyword: 'seo optimization',
          location: 'United States',
          tone: 'invalid-tone' as any
        }

        expect(() => contentSchemas.generateContent.parse(invalidData)).toThrow()
      })

      it('should reject invalid location', () => {
        const invalidLocations = [
          'U', // too short
          'a'.repeat(51), // too long
          'Location123', // contains numbers
          'Location!', // special characters
          ''
        ]

        invalidLocations.forEach(location => {
          const data = {
            keyword: 'seo optimization',
            location
          }

          expect(() => contentSchemas.generateContent.parse(data)).toThrow()
        })
      })

      it('should reject long additional instructions', () => {
        const invalidData = {
          keyword: 'seo optimization',
          location: 'United States',
          additionalInstructions: 'a'.repeat(501)
        }

        expect(() => contentSchemas.generateContent.parse(invalidData)).toThrow()
      })
    })

    describe('updateContent', () => {
      it('should validate correct content update data', () => {
        const validData: UpdateContentSchema = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'SEO Best Practices',
          content: 'This is a comprehensive guide to SEO optimization that covers all the essential aspects...',
          metaDescription: 'Learn SEO best practices for better search rankings',
          tags: ['seo', 'optimization', 'digital marketing']
        }

        expect(() => contentSchemas.updateContent.parse(validData)).not.toThrow()
      })

      it('should reject invalid content length', () => {
        const invalidData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'SEO Best Practices',
          content: 'Too short', // less than 100 characters
          metaDescription: 'Learn SEO best practices'
        }

        expect(() => contentSchemas.updateContent.parse(invalidData)).toThrow()
      })

      it('should reject long meta description', () => {
        const invalidData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'SEO Best Practices',
          content: 'This is a comprehensive guide to SEO optimization that covers all the essential aspects...',
          metaDescription: 'a'.repeat(161) // too long
        }

        expect(() => contentSchemas.updateContent.parse(invalidData)).toThrow()
      })

      it('should reject too many tags', () => {
        const invalidData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'SEO Best Practices',
          content: 'This is a comprehensive guide to SEO optimization that covers all the essential aspects...',
          tags: Array(11).fill('tag') // too many tags
        }

        expect(() => contentSchemas.updateContent.parse(invalidData)).toThrow()
      })
    })

    describe('contentAnalysis', () => {
      it('should validate correct content analysis data', () => {
        const validData = {
          url: 'https://example.com',
          includeImages: true,
          includeLinks: false,
          maxDepth: 2
        }

        expect(() => contentSchemas.contentAnalysis.parse(validData)).not.toThrow()
      })

      it('should apply default values', () => {
        const minimalData = {
          url: 'https://example.com'
        }

        const result = contentSchemas.contentAnalysis.parse(minimalData)
        expect(result.includeImages).toBe(false)
        expect(result.includeLinks).toBe(true)
        expect(result.maxDepth).toBe(1)
      })

      it('should reject invalid max depth', () => {
        const invalidData = {
          url: 'https://example.com',
          maxDepth: 0 // too low
        }

        expect(() => contentSchemas.contentAnalysis.parse(invalidData)).toThrow()
      })
    })
  })

  describe('userSchemas', () => {
    describe('updateProfile', () => {
      it('should validate correct profile update data', () => {
        const validData: UpdateProfileSchema = {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Inc',
          website: 'https://johndoe.com',
          bio: 'Digital marketing expert with 10+ years experience',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            push: false,
            marketing: true
          }
        }

        expect(() => userSchemas.updateProfile.parse(validData)).not.toThrow()
      })

      it('should handle optional fields', () => {
        const minimalData = {
          firstName: 'John',
          lastName: 'Doe'
        }

        expect(() => userSchemas.updateProfile.parse(minimalData)).not.toThrow()
      })

      it('should reject invalid names', () => {
        const invalidData = {
          firstName: 'John123',
          lastName: 'Doe!'
        }

        expect(() => userSchemas.updateProfile.parse(invalidData)).toThrow()
      })

      it('should reject long bio', () => {
        const invalidData = {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'a'.repeat(501)
        }

        expect(() => userSchemas.updateProfile.parse(invalidData)).toThrow()
      })
    })

    describe('updateSettings', () => {
      it('should validate correct settings update data', () => {
        const validData = {
          theme: 'dark' as const,
          language: 'en' as const,
          defaultWordCount: 1500,
          defaultTone: 'technical' as const,
          autoSave: false,
          showTutorials: true
        }

        expect(() => userSchemas.updateSettings.parse(validData)).not.toThrow()
      })

      it('should apply default values', () => {
        const emptyData = {}

        const result = userSchemas.updateSettings.parse(emptyData)
        expect(result.theme).toBe('system')
        expect(result.language).toBe('en')
        expect(result.defaultWordCount).toBe(1000)
        expect(result.defaultTone).toBe('professional')
        expect(result.autoSave).toBe(true)
        expect(result.showTutorials).toBe(true)
      })

      it('should reject invalid theme', () => {
        const invalidData = {
          theme: 'invalid-theme' as any
        }

        expect(() => userSchemas.updateSettings.parse(invalidData)).toThrow()
      })

      it('should reject invalid word count', () => {
        const invalidData = {
          defaultWordCount: 100 // too low
        }

        expect(() => userSchemas.updateSettings.parse(invalidData)).toThrow()
      })
    })
  })

  describe('apiSchemas', () => {
    describe('pagination', () => {
      it('should validate correct pagination data', () => {
        const validData: PaginationSchema = {
          page: 1,
          limit: 20,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }

        expect(() => apiSchemas.pagination.parse(validData)).not.toThrow()
      })

      it('should apply default values', () => {
        const emptyData = {}

        const result = apiSchemas.pagination.parse(emptyData)
        expect(result.page).toBe(1)
        expect(result.limit).toBe(20)
        expect(result.sortOrder).toBe('desc')
      })

      it('should reject invalid page number', () => {
        const invalidData = {
          page: 0 // too low
        }

        expect(() => apiSchemas.pagination.parse(invalidData)).toThrow()
      })

      it('should reject invalid limit', () => {
        const invalidData = {
          limit: 101 // too high
        }

        expect(() => apiSchemas.pagination.parse(invalidData)).toThrow()
      })
    })

    describe('search', () => {
      it('should validate correct search data', () => {
        const validData: SearchSchema = {
          query: 'seo optimization',
          filters: { category: 'marketing' },
          page: 1,
          limit: 10
        }

        expect(() => apiSchemas.search.parse(validData)).not.toThrow()
      })

      it('should reject empty query', () => {
        const invalidData = {
          query: ''
        }

        expect(() => apiSchemas.search.parse(invalidData)).toThrow()
      })

      it('should reject long query', () => {
        const invalidData = {
          query: 'a'.repeat(101)
        }

        expect(() => apiSchemas.search.parse(invalidData)).toThrow()
      })
    })

    describe('bulkOperation', () => {
      it('should validate correct bulk operation data', () => {
        const validData = {
          ids: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
          operation: 'delete' as const,
          confirm: true
        }

        expect(() => apiSchemas.bulkOperation.parse(validData)).not.toThrow()
      })

      it('should reject unconfirmed operation', () => {
        const invalidData = {
          ids: ['550e8400-e29b-41d4-a716-446655440000'],
          operation: 'delete' as const,
          confirm: false
        }

        expect(() => apiSchemas.bulkOperation.parse(invalidData)).toThrow()
      })

      it('should reject empty ids array', () => {
        const invalidData = {
          ids: [],
          operation: 'delete' as const,
          confirm: true
        }

        expect(() => apiSchemas.bulkOperation.parse(invalidData)).toThrow()
      })

      it('should reject too many ids', () => {
        const invalidData = {
          ids: Array(101).fill('550e8400-e29b-41d4-a716-446655440000'),
          operation: 'delete' as const,
          confirm: true
        }

        expect(() => apiSchemas.bulkOperation.parse(invalidData)).toThrow()
      })
    })
  })

  describe('fileSchemas', () => {
    describe('upload', () => {
      it('should validate correct file upload data', () => {
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
        const validData: FileUploadSchema = {
          file: mockFile,
          type: 'document',
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['text/plain']
        }

        expect(() => fileSchemas.upload.parse(validData)).not.toThrow()
      })

      it('should reject oversized file', () => {
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
        Object.defineProperty(mockFile, 'size', { value: 11 * 1024 * 1024 }) // 11MB

        const invalidData = {
          file: mockFile,
          type: 'document' as const,
          maxSize: 10 * 1024 * 1024
        }

        expect(() => fileSchemas.upload.parse(invalidData)).toThrow()
      })

      it('should reject disallowed file type', () => {
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
        const invalidData = {
          file: mockFile,
          type: 'document' as const,
          allowedTypes: ['image/jpeg']
        }

        expect(() => fileSchemas.upload.parse(invalidData)).toThrow()
      })
    })

    describe('csvImport', () => {
      it('should validate correct CSV import data', () => {
        const mockFile = new File(['test,content'], 'test.csv', { type: 'text/csv' })
        const validData = {
          file: mockFile,
          hasHeaders: true,
          delimiter: ',' as const,
          encoding: 'utf-8' as const,
          skipRows: 0
        }

        expect(() => fileSchemas.csvImport.parse(validData)).not.toThrow()
      })

      it('should apply default values', () => {
        const mockFile = new File(['test,content'], 'test.csv', { type: 'text/csv' })
        const minimalData = {
          file: mockFile
        }

        const result = fileSchemas.csvImport.parse(minimalData)
        expect(result.hasHeaders).toBe(true)
        expect(result.delimiter).toBe(',')
        expect(result.encoding).toBe('utf-8')
        expect(result.skipRows).toBe(0)
      })
    })
  })

  describe('webhookSchemas', () => {
    describe('stripe', () => {
      it('should validate correct Stripe webhook data', () => {
        const validData = {
          id: 'evt_test_webhook',
          object: 'event',
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test' } },
          created: 1625097600,
          livemode: false
        }

        expect(() => webhookSchemas.stripe.parse(validData)).not.toThrow()
      })

      it('should reject invalid Stripe webhook data', () => {
        const invalidData = {
          id: 'evt_test_webhook',
          object: 'event',
          type: 'payment_intent.succeeded',
          // missing data, created, livemode
        }

        expect(() => webhookSchemas.stripe.parse(invalidData)).toThrow()
      })
    })

    describe('supabase', () => {
      it('should validate correct Supabase webhook data', () => {
        const validData = {
          type: 'INSERT' as const,
          table: 'users',
          record: { id: 1, name: 'John' },
          schema: 'public'
        }

        expect(() => webhookSchemas.supabase.parse(validData)).not.toThrow()
      })

      it('should apply default schema', () => {
        const data = {
          type: 'INSERT' as const,
          table: 'users',
          record: { id: 1, name: 'John' }
        }

        const result = webhookSchemas.supabase.parse(data)
        expect(result.schema).toBe('public')
      })

      it('should reject invalid type', () => {
        const invalidData = {
          type: 'INVALID' as any,
          table: 'users'
        }

        expect(() => webhookSchemas.supabase.parse(invalidData)).toThrow()
      })
    })
  })

  describe('validateSchema helper', () => {
    it('should return success for valid data', () => {
      const result = validateSchema(baseSchemas.email, 'test@example.com')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should return error for invalid data', () => {
      const result = validateSchema(baseSchemas.email, 'invalid-email')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(z.ZodError)
        expect(result.errors.issues).toHaveLength(1)
      }
    })

    it('should handle complex schema validation', () => {
      const validData = {
        email: 'test@example.com',
        password: 'any-password'
      }

      const result = validateSchema(authSchemas.login, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.rememberMe).toBe(false) // default value
      }
    })

    it('should handle schema with transform', () => {
      const schema = z.string().transform(val => val.toUpperCase())
      const result = validateSchema(schema, 'hello')
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('HELLO')
      }
    })

    it('should handle schema with refine', () => {
      const schema = z.string().refine(val => val.includes('@'), 'Must contain @')
      
      const validResult = validateSchema(schema, 'test@example.com')
      expect(validResult.success).toBe(true)
      
      const invalidResult = validateSchema(schema, 'invalid')
      expect(invalidResult.success).toBe(false)
    })

    it('should rethrow non-ZodError exceptions', () => {
      const schema = z.string().transform(() => {
        throw new Error('Custom error')
      })

      expect(() => validateSchema(schema, 'test')).toThrow('Custom error')
    })
  })

  describe('Type inference', () => {
    it('should infer correct types', () => {
      const loginData: LoginSchema = {
        email: 'test@example.com',
        password: 'password',
        rememberMe: true
      }

      const registerData: RegisterSchema = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true
      }

      const contentData: GenerateContentSchema = {
        keyword: 'seo',
        location: 'United States',
        wordCount: 1000,
        tone: 'professional',
        includeImages: false
      }

      // Type checking - these should not cause TypeScript errors
      expect(loginData.email).toBe('test@example.com')
      expect(registerData.firstName).toBe('John')
      expect(contentData.keyword).toBe('seo')
    })
  })

  describe('Schema composition', () => {
    it('should compose schemas correctly', () => {
      // Test that schemas are properly composed
      expect(validationSchemas.auth.login).toBe(authSchemas.login)
      expect(validationSchemas.content.generateContent).toBe(contentSchemas.generateContent)
      expect(validationSchemas.user.updateProfile).toBe(userSchemas.updateProfile)
      expect(validationSchemas.api.pagination).toBe(apiSchemas.pagination)
      expect(validationSchemas.file.upload).toBe(fileSchemas.upload)
      expect(validationSchemas.webhook.stripe).toBe(webhookSchemas.stripe)
      expect(validationSchemas.base.email).toBe(baseSchemas.email)
    })
  })

  describe('Edge cases', () => {
    it('should handle null and undefined values', () => {
      expect(() => baseSchemas.email.parse(null)).toThrow()
      expect(() => baseSchemas.email.parse(undefined)).toThrow()
    })

    it('should handle empty strings', () => {
      expect(() => baseSchemas.email.parse('')).toThrow()
      expect(() => baseSchemas.keyword.parse('')).toThrow()
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000)
      expect(() => baseSchemas.keyword.parse(longString)).toThrow()
    })

    it('should handle special characters', () => {
      expect(() => baseSchemas.keyword.parse('keyword<script>')).toThrow()
      expect(() => baseSchemas.safeText.parse('text{malicious}')).toThrow()
    })

    it('should handle number edge cases', () => {
      expect(() => baseSchemas.positiveInteger.parse(0)).toThrow()
      expect(() => baseSchemas.positiveInteger.parse(-1)).toThrow()
      expect(() => baseSchemas.positiveInteger.parse(3.14)).toThrow()
    })

    it('should handle boolean edge cases', () => {
      expect(() => authSchemas.login.parse({ 
        email: 'test@example.com', 
        password: 'password',
        rememberMe: 'true' as any 
      })).toThrow()
    })
  })

  describe('Performance', () => {
    it('should validate large objects efficiently', () => {
      const largeObject = {
        items: Array(1000).fill(0).map((_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          active: i % 2 === 0
        }))
      }

      const schema = z.object({
        items: z.array(z.object({
          id: z.string(),
          name: z.string(),
          active: z.boolean()
        }))
      })

      const start = performance.now()
      const result = validateSchema(schema, largeObject)
      const end = performance.now()

      expect(result.success).toBe(true)
      expect(end - start).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should handle concurrent validations', async () => {
      const validations = Array(100).fill(0).map((_, i) => 
        validateSchema(baseSchemas.email, `test${i}@example.com`)
      )

      const results = await Promise.all(validations)
      expect(results.every(r => r.success)).toBe(true)
    })
  })
})