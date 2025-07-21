# Contributing to SEO Automation Platform

Thank you for your interest in contributing to the SEO Automation Platform! This document outlines our development standards and contribution process.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm (latest version)
- Git

### Local Development
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.local.example .env.local`
4. Fill in required environment variables
5. Start development server: `npm run dev`

## Code Standards

### TypeScript
- **Strict Mode**: All code must pass TypeScript strict mode
- **Type Definitions**: Create explicit types for all data structures
- **No `any`**: Avoid using `any` type unless absolutely necessary
- **Imports**: Use absolute imports with `@/` prefix

```typescript
// ✅ Good
interface User {
  id: string
  email: string
  createdAt: Date
}

// ❌ Bad
const user: any = { ... }
```

### React Components
- **Functional Components**: Use function declarations, not arrow functions
- **Props Interface**: Define explicit props interfaces
- **Default Props**: Use default parameters instead of defaultProps
- **Hooks**: Follow Rules of Hooks

```typescript
// ✅ Good
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  return <button className={cn(variants[variant], sizes[size])}>{children}</button>
}

// ❌ Bad
const Button = ({ variant, size, children }: any) => { ... }
```

### Styling
- **Tailwind CSS**: Use Tailwind classes for styling
- **Component Variants**: Use `class-variance-authority` for component variants
- **Design System**: Follow shadcn/ui patterns for new components
- **Responsive**: Mobile-first responsive design

```typescript
// ✅ Good
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
    },
  }
)
```

### File Organization
- **Components**: Group related components in feature directories
- **Utilities**: Pure functions in `lib/utils/`
- **Types**: Shared types in `types/`
- **Constants**: Application constants in dedicated files

```
src/
├── components/
│   └── feature-name/
│       ├── component-name.tsx
│       ├── component-name.test.tsx
│       └── index.ts
├── lib/
│   └── feature-name/
│       ├── utils.ts
│       ├── types.ts
│       └── constants.ts
```

## Git Workflow

### Branch Naming
- **Feature**: `feature/description-of-feature`
- **Bug Fix**: `fix/description-of-fix`
- **Hotfix**: `hotfix/description-of-hotfix`
- **Chore**: `chore/description-of-task`

### Commit Messages
Follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

feat(auth): add user registration flow
fix(api): resolve CORS issue in production
docs(readme): update installation instructions
test(utils): add unit tests for date helpers
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Add/update tests for new functionality
4. Ensure all checks pass (linting, tests, build)
5. Create pull request with clear description
6. Request review from maintainers
7. Address feedback and make necessary changes
8. Merge when approved

## Testing Standards

### Unit Tests
- **Coverage**: Maintain minimum 80% code coverage
- **Test Structure**: Arrange, Act, Assert pattern
- **Mocking**: Mock external dependencies and API calls
- **File Location**: Tests alongside source files (`component.test.tsx`)

```typescript
// ✅ Good test structure
describe('Button Component', () => {
  it('should render with correct variant classes', () => {
    // Arrange
    const props = { variant: 'primary' as const }
    
    // Act
    render(<Button {...props}>Click me</Button>)
    
    // Assert
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })
})
```

### E2E Tests
- **User Flows**: Test complete user journeys
- **Critical Paths**: Focus on main application features
- **Page Objects**: Use page object pattern for complex flows
- **Environment**: Tests should work in isolation

### Test Commands
```bash
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run E2E tests
```

## API Development

### Route Handlers
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Input validation using Zod schemas
- **Rate Limiting**: Implement rate limiting for public endpoints
- **Authentication**: Verify authentication for protected routes

```typescript
// ✅ Good API route structure
export async function POST(request: Request) {
  try {
    // Validate input
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    
    // Check authentication
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Business logic
    const result = await createUser(validatedData)
    
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### Database Operations
- **Type Safety**: Use generated Supabase types
- **RLS Policies**: Implement Row Level Security
- **Transactions**: Use transactions for multi-step operations
- **Migrations**: Version control database schema changes

## Performance Guidelines

### Core Web Vitals
- **LCP**: Optimize Largest Contentful Paint (< 2.5s)
- **FID**: Minimize First Input Delay (< 100ms)
- **CLS**: Avoid Cumulative Layout Shift (< 0.1)

### Best Practices
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching**: Implement appropriate caching strategies

```typescript
// ✅ Good - Dynamic import for code splitting
const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <Skeleton />,
})

// ✅ Good - Optimized image
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority
/>
```

## Security Guidelines

### Authentication
- **JWT Tokens**: Secure token handling
- **Session Management**: Proper session lifecycle
- **Password Security**: Strong password requirements
- **Rate Limiting**: Prevent brute force attacks

### Data Protection
- **Input Sanitization**: Sanitize all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Prevent cross-site scripting
- **CSRF Protection**: Implement CSRF tokens

### API Security
- **Environment Variables**: Never commit secrets
- **API Keys**: Rotate keys regularly
- **CORS**: Configure proper CORS policies
- **Rate Limiting**: Implement per-endpoint limits

## Documentation

### Code Comments
- **JSDoc**: Use JSDoc for public APIs
- **Complex Logic**: Comment complex business logic
- **TODOs**: Use TODO comments for temporary code
- **Examples**: Provide usage examples for utilities

```typescript
/**
 * Generates SEO-optimized content using AI
 * @param params - Content generation parameters
 * @param params.keyword - Target keyword for SEO
 * @param params.contentType - Type of content to generate
 * @returns Promise resolving to generated content
 * @example
 * ```typescript
 * const content = await generateContent({
 *   keyword: 'react hooks',
 *   contentType: 'blog-post'
 * })
 * ```
 */
export async function generateContent(params: ContentParams): Promise<GeneratedContent> {
  // Implementation
}
```

### README Updates
- **Feature Documentation**: Document new features
- **Setup Instructions**: Keep setup instructions current
- **API Changes**: Document breaking API changes
- **Examples**: Provide working code examples

## Code Review Guidelines

### For Authors
- **Self Review**: Review your own code before requesting review
- **Small PRs**: Keep pull requests focused and small
- **Clear Description**: Provide clear PR description and context
- **Tests**: Include tests for new functionality

### For Reviewers
- **Constructive Feedback**: Provide helpful, actionable feedback
- **Security**: Check for security vulnerabilities
- **Performance**: Consider performance implications
- **Maintainability**: Ensure code is maintainable long-term

## Release Process

### Versioning
- **Semantic Versioning**: Follow semver (major.minor.patch)
- **Breaking Changes**: Major version for breaking changes
- **New Features**: Minor version for new features
- **Bug Fixes**: Patch version for bug fixes

### Deployment
- **Staging**: All changes tested in staging environment
- **Production**: Deploy during low-traffic periods
- **Rollback**: Have rollback plan for each deployment
- **Monitoring**: Monitor application health post-deployment

## Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our development Discord server
- **Email**: Contact maintainers at dev@seoautomation.com

Thank you for contributing to making the SEO Automation Platform better!