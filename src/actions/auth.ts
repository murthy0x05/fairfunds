"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth";
import { signUpSchema, signInSchema } from "@/lib/validators/schemas";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await nextAuthSignIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export async function signInAction(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await nextAuthSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // AuthError is thrown when credentials are invalid
    if ((error as Error).message?.includes("NEXT_REDIRECT")) {
      throw error; // This is a redirect, not an error
    }
    return { error: "Invalid email or password" };
  }
}

export async function signOutAction() {
  await nextAuthSignOut({ redirectTo: "/login" });
}
