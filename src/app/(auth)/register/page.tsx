"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, signInWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Loader2, Github } from "lucide-react";

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
    <Card className="animate-in">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start splitting expenses fairly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-6">
          <Button variant="outline" type="button" onClick={() => handleOAuth("google")} disabled={!!oauthLoading}>
            {oauthLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign up with Google
          </Button>
          <Button variant="outline" type="button" onClick={() => handleOAuth("github")} disabled={!!oauthLoading}>
            {oauthLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Github className="w-4 h-4 mr-2" />}
            Sign up with GitHub
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
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
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
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
            <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
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
          <Button type="submit" className="w-full" size="lg" disabled={loading || !!oauthLoading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
