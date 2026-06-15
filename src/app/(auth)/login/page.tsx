"use client";

import { useState } from "react";
import Link from "next/link";
import { signInAction, signInWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signInAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    await signInWithOAuth(provider);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display-sm mb-1">Welcome back</h1>
        <p className="text-body-sm text-muted">
          Sign in to your account
        </p>
      </div>

      <div className="flex flex-col gap-2.5 mb-6">
        <Button
          variant="secondary"
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading}
          className="w-full h-10 text-[14px]"
        >
          {oauthLoading === "google" && (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          )}
          Sign in with Google
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={!!oauthLoading}
          className="w-full h-10 text-[14px]"
        >
          {oauthLoading === "github" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <GithubIcon className="w-4 h-4 mr-2" />
          )}
          Sign in with GitHub
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-[12px] uppercase tracking-wider">
          <span className="bg-canvas px-3 text-muted-soft">or</span>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error/8 border border-error/15 px-4 py-3 text-[14px] text-error">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-caption text-ink">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-caption text-ink">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !!oauthLoading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-body-sm text-muted mt-8 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:text-primary-active font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}
