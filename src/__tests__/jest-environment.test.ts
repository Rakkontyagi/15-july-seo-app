/**
 * Jest Environment Test
 * Verifies that the Jest testing environment is properly configured
 */

describe('Jest Environment', () => {
  it('should have the correct test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have required environment variables', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.OPENAI_API_KEY).toBeDefined();
  });

  it('should have global test utilities', () => {
    expect(global.fetch).toBeDefined();
    expect(global.IntersectionObserver).toBeDefined();
    expect(global.ResizeObserver).toBeDefined();
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });

  it('should properly mock fetch', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: 'test' }),
      } as Response)
    );

    const response = await fetch('https://api.test.com');
    const data = await response.json();
    
    expect(data).toEqual({ data: 'test' });
    expect(fetch).toHaveBeenCalledWith('https://api.test.com');
  });

  it('should handle React components', () => {
    const React = require('react');
    const element = React.createElement('div', null, 'Hello Test');
    expect(element.type).toBe('div');
    expect(element.props.children).toBe('Hello Test');
  });
});

describe('TypeScript Support', () => {
  interface TestInterface {
    name: string;
    value: number;
  }

  it('should support TypeScript interfaces', () => {
    const testObj: TestInterface = {
      name: 'test',
      value: 42
    };

    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(42);
  });

  it('should support generics', () => {
    function identity<T>(arg: T): T {
      return arg;
    }

    expect(identity<string>('test')).toBe('test');
    expect(identity<number>(42)).toBe(42);
  });
});