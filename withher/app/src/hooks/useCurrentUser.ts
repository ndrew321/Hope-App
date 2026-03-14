import { useAppSelector } from '../store/hooks';
import type { AppUser } from '../types';

export function useCurrentUser(): AppUser | null {
  return useAppSelector((s) => s.user.currentUser);
}
