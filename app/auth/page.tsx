"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSupabaseUser } from "@/lib/supabase/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Msg = { kind: "info" | "error" | "success"; text: string } | null;

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, user, loading } = useSupabaseUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  // Surface errors Supabase puts in the URL when an emailed link fails.
  useEffect(() => {
    const err =
      searchParams.get("error_description") ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.slice(1)).get("error_description")
        : null);
    if (err) setMsg({ kind: "error", text: err });
  }, [searchParams]);

  const notConfigured = () =>
    setMsg({ kind: "error", text: "Supabase is not configured in this environment." });

  const signUp = async () => {
    setMsg(null);
    if (!supabase) return notConfigured();
    if (!email || password.length < 6) {
      setMsg({ kind: "error", text: "Enter an email and a password of at least 6 characters." });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setMsg({
      kind: "info",
      text: `Almost done: we sent a confirmation link to ${email}. Open it in this browser and you'll be signed in automatically.`,
    });
  };

  const signIn = async () => {
    setMsg(null);
    if (!supabase) return notConfigured();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const text =
        error.message === "Email not confirmed"
          ? "Please confirm your email first. Check your inbox for the confirmation link."
          : error.message;
      return setMsg({ kind: "error", text });
    }
    setMsg({ kind: "success", text: "Signed in. Taking you to your dashboard…" });
    router.push("/dashboard");
    router.refresh();
  };

  const magic = async () => {
    setMsg(null);
    if (!supabase) return notConfigured();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    setMsg(
      error
        ? { kind: "error", text: error.message }
        : { kind: "info", text: `Magic link sent to ${email}. Open it in this browser to sign in.` }
    );
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMsg({ kind: "info", text: "You have been signed out." });
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> You&apos;re signed in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/scenarios/new">Create a scenario</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
              <Button variant="ghost" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const msgClass =
    msg?.kind === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : msg?.kind === "success"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-foreground";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <Tabs defaultValue="password">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Email / password</TabsTrigger>
          <TabsTrigger value="magic">Magic link</TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signIn()}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={signIn} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <Button type="button" variant="secondary" onClick={signUp} disabled={busy}>
                  Sign up
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="magic">
          <Card>
            <CardHeader>
              <CardTitle>Magic link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email2">Email</Label>
                <Input
                  id="email2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="button" onClick={magic} disabled={busy}>
                Send link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {msg && (
        <p className={`rounded-md border px-3 py-2 text-sm ${msgClass}`} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}
