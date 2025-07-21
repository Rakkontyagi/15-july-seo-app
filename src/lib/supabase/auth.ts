import { createBrowserClient } from '@supabase/ssr';
import { type AuthError, type User, type Session } from '@supabase/supabase-js';
import { validateEmail, validatePassword } from '@/lib/auth/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  options?: {
    data?: {
      full_name?: string;
    };
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, options }: SignUpData) {
  // Client-side validation
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors[0]);
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  // Client-side validation
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  if (!password) {
    throw new Error('Password is required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Send password reset email
 */
export async function resetPassword({ email }: ResetPasswordData) {
  // Client-side validation
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update user password
 */
export async function updatePassword({ password }: UpdatePasswordData) {
  // Client-side validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors[0]);
  }

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(updates: UpdateProfileData) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get current user session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}