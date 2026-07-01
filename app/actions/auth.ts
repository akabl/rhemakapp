// app/actions/auth.ts
'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// Action 1: Create a new user profile on Supabase (With secure password validation)
export async function registerUser(username: string, email: string, password: string) {
  if (!username || !email || !password) {
    return { error: "All fields are required." };
  }

  // Server-side security checks (parallels our real-time frontend indicators)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password); // Any non-alphanumeric character

  if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return { error: "Password does not meet the minimum security requirements." };
  }

  try {
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return { error: "Username or email is already taken." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        reputation: 10,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Registration failed:", error);
    return { error: "An unexpected error occurred during signup." };
  }
}

// Action 2: Trigger NextAuth Credentials Sign-In (Leave exactly as is)
export async function loginUser(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/forum",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password combination." };
        default:
          return { error: "Something went wrong during login." };
      }
    }
    throw error;
  }
}