// Global test mocks

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Redirect: jest.fn(() => null),
  Link: jest.fn(() => null),
}));

// Mock react-native Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 1024, height: 768 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  useWindowDimensions: jest.fn(() => ({ width: 1024, height: 768 })),
  Platform: {
    OS: 'web',
    select: jest.fn((obj: Record<string, any>) => obj.web || obj.default),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock global fetch
global.fetch = jest.fn();
