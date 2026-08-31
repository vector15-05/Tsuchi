import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:6767',
});

export const { useSession, signIn, signUp, signOut } = authClient;
