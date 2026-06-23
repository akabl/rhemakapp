// app/actions/password.ts
'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// --- ACTION 1: CHANGE PASSWORD (AUTHENTICATED USERS) ---
export async function changePassword(data: {
  currentPass: string;
  newPass: string;
  confirmPass: string;
}) {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    return { error: "You must be logged in to change your password." };
  }

  if (data.newPass !== data.confirmPass) {
    return { error: "New passwords do not match." };
  }

  try {
    // 1. Fetch user from Supabase
    const dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) return { error: "User not found." };

    // 2. Verify current password
    const isMatch = await bcrypt.compare(data.currentPass, dbUser.passwordHash);
    if (!isMatch) {
      return { error: "The current password you entered is incorrect." };
    }

    // 3. Hash and save the new password
    const newPasswordHash = await bcrypt.hash(data.newPass, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// --- ACTION 2: FORGOT PASSWORD (GENERATE RESET TOKEN) ---
export async function sendPasswordResetRequest(email: string) {
  if (!email) return { error: "Email is required." };

  try {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      // Security practice: Don't reveal that the email doesn't exist
      return { success: true };
    }

    // 1. Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: user.email }
    });

    // 2. Generate a unique reset token (32-byte hex string)
    const token = require('crypto').randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Expires in 1 hour

    // 3. Save token in database
    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt
      }
    });

    // 4. Print the reset link to your server console for testing!
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`\n🔑 [RHEMAKA PASSWORD RESET]`);
    console.log(`Target Email: ${user.email}`);
    console.log(`Reset Link: ${resetUrl}\n`);

    return { success: true, devToken: token }; // Return token in dev mode for on-screen clickability
  } catch (error) {
    console.error("Forgot password error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// --- ACTION 3: RESET PASSWORD (EXECUTE TOKEN REDEMPTION) ---
export async function resetPasswordWithToken(data: {
  token: string;
  newPass: string;
  confirmPass: string;
}) {
  if (!data.token || !data.newPass) return { error: "Invalid request data." };

  if (data.newPass !== data.confirmPass) {
    return { error: "Passwords do not match." };
  }

  try {
    // 1. Find the token record in Supabase
    const resetTokenRecord = await db.passwordResetToken.findUnique({
      where: { token: data.token }
    });

    if (!resetTokenRecord) {
      return { error: "This password reset link is invalid or has already been used." };
    }

    // 2. Verify token expiration
    if (new Date() > resetTokenRecord.expiresAt) {
      await db.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
      return { error: "This password reset link has expired." };
    }

    // 3. Hash the new password
    const newPasswordHash = await bcrypt.hash(data.newPass, 10);

    // 4. Update the user and delete the token in a transaction
    await db.$transaction([
      db.user.update({
        where: { email: resetTokenRecord.email },
        data: { passwordHash: newPasswordHash }
      }),
      db.passwordResetToken.delete({
        where: { id: resetTokenRecord.id }
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}