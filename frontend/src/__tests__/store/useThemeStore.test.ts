import { useThemeStore } from '../../store/useThemeStore';

beforeEach(() => {
  useThemeStore.setState({
    mode: 'dark',
    isHydrated: false,
  });
});

describe('useThemeStore', () => {
  test('has correct initial state', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isHydrated).toBe(false);
  });

  test('setMode changes mode to light', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  test('setMode changes mode to dark', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  test('toggleMode toggles dark to light', () => {
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  test('toggleMode toggles light to dark', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  test('double toggle returns to original', () => {
    useThemeStore.getState().toggleMode();
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  test('setHydrated sets isHydrated to true', () => {
    useThemeStore.getState().setHydrated(true);
    expect(useThemeStore.getState().isHydrated).toBe(true);
  });

  test('setHydrated can set back to false', () => {
    useThemeStore.getState().setHydrated(true);
    useThemeStore.getState().setHydrated(false);
    expect(useThemeStore.getState().isHydrated).toBe(false);
  });
});
