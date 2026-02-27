import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ProfileScreen() {
  useEffect(() => {
    router.replace('/settings?tab=profile');
  }, []);

  return null;
}
