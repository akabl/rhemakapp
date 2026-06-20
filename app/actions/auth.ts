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
    // Check if username or email already exists
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

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user in Supabase
    await db.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        reputation: 10, // Starting reputation
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Registration failed:", error);
    return { error: "An unexpected error occurred during signup." };
  }
}

// Action 2: Trigger NextAuth Credentials Sign-In
export async function loginUser(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Prevents automatic default redirects so we can handle it in our client component
    });
    return { success: true };
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