"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, signInWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
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
      <h1 className="text-xl font-semibold mb-1">Create an account</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Start splitting expenses fairly
      </p>

      <div className="flex flex-col gap-2.5 mb-6">
        <Button variant="outline" type="button" className="w-full justify-center" onClick={() => handleOAuth("google")} disabled={!!oauthLoading}>
          {oauthLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Continue with Google
        </Button>
        <Button variant="outline" type="button" className="w-full justify-center" onClick={() => handleOAuth("github")} disabled={!!oauthLoading}>
          {oauthLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GithubIcon className="w-4 h-4" />}
          Continue with GitHub
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-[var(--color-tertiary)]">or</span>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
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
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !!oauthLoading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
