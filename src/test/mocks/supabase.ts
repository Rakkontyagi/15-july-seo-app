export const mockSupabaseClient = {
  from: jest.fn((tableName: string) => ({
    select: jest.fn(() => {
      const mockData: Record<string, any[]> = {
        'subscription_tiers': [
          {
            content_limit: 10,
            display_name: 'Basic',
            features: { content_generation: true },
            id: '1',
            is_active: true,
            name: 'basic',
            price_monthly: 9.99,
            price_yearly: 99.99,
          },
        ],
        // Add other table data as needed for tests
      };

      return {
        eq: jest.fn((column: string, value: any) => {
          let filteredData = mockData[tableName] || [];
          if (column === 'is_active' && value === true) {
            filteredData = filteredData.filter(item => item.is_active);
          }
          return {
            order: jest.fn(() => ({
              single: jest.fn(() => ({
                data: filteredData.length > 0 ? filteredData[0] : null,
                error: null,
              })),
              data: filteredData,
              error: null,
            })),
            single: jest.fn(() => ({
              data: filteredData.length > 0 ? filteredData[0] : null,
              error: null,
            })),
            data: filteredData,
            error: null,
          };
        }),
        order: jest.fn(() => ({
          data: mockData[tableName] || [],
          error: null,
        })),
        data: mockData[tableName] || [],
        error: null,
      };
    }),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'new-mock-id' },
          error: null,
        })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'updated-mock-id' },
            error: null,
          })),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    upsert: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [], // Directly return data for upsert.eq
        error: null,
      })),
    })),
  })),
  auth: {
    getSession: jest.fn(() =>
      Promise.resolve({
        data: {
          session: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      })
    ),
    signInWithPassword: jest.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      })
    ),
    signUp: jest.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      })
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
  rpc: jest.fn(() => ({
    data: [],
    error: null,
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => ({
        data: { path: 'test-path' },
        error: null,
      })),
      download: jest.fn(() => ({
        data: { blob: new Blob(['test']) },
        error: null,
      })),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'http://example.com/test' },
      })),
    })),
  },
};
