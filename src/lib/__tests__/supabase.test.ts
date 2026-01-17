// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Supabase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => {
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('../supabase');
        });
      }).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => {
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('../supabase');
        });
      }).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    });

    it('should create client successfully when both environment variables are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => {
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('../supabase');
        });
      }).not.toThrow();
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    it('should return true when connection test succeeds', async () => {
      // Mock successful connection
      const mockLimit = jest.fn().mockResolvedValue({ error: null });
      const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { testConnection } = require('../supabase');
      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pharmacies');
      expect(mockSelect).toHaveBeenCalledWith('count');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return false when connection test fails with error', async () => {
      // Mock failed connection
      const mockLimit = jest.fn().mockResolvedValue({ error: { message: 'Connection failed' } });
      const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { testConnection } = require('../supabase');
      const result = await testConnection();

      expect(result).toBe(false);
    });

    it('should return false when connection test throws exception', async () => {
      // Mock exception during connection
      const mockLimit = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { testConnection } = require('../supabase');
      const result = await testConnection();

      expect(result).toBe(false);
    });
  });
});