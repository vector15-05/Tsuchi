import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:6767', // better-auth mounts its own routes here
});

// Named exports for ergonomic use in client components
export const { useSession, signIn, signUp, signOut } = authClient;
