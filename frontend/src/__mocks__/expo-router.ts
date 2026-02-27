export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
};

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
}));

export const useLocalSearchParams = jest.fn(() => ({}));

export const Redirect = jest.fn(() => null);

export const Link = jest.fn(() => null);
