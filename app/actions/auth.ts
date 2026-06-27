// app/actions/auth.ts
'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// Action 1: Create a new user profile on Supabase
export async function registerUser(username: string, email: string, password: string) {
  if (!username || !email || !password) {
    return { error: "All fields are required." };
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

// Action 2: Trigger NextAuth Credentials Sign-In (Using native Server-Side Redirects)
export async function loginUser(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/forum", // Next.js will handle cookie setting and redirect safely on the server!
    });
  } catch (error) {
    // NextAuth throws AuthError if credentials mismatch
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password combination." };
        default:
          return { error: "Something went wrong during login." };
      }
    }
    
    // IMPORTANT: In NextAuth v5, successful login internally throws a Redirect error.
    // We MUST re-throw the error so that Next.js can intercept it and perform the redirect!
    throw error;
  }
}