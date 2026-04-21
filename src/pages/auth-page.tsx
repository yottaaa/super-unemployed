import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import appLogo from "@/assets/super_unemployed.webp";

export function AuthPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  if (session) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const submitEmailAuth = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isSignUp ? "Account created. Check your email if confirmation is enabled." : "Signed in");
  };

  const signInGoogle = async () => {
    // Ensure origin doesn't have a double slash if you manually add one
    const origin = window.location.origin.endsWith('/') 
      ? window.location.origin.slice(0, -1) 
      : window.location.origin;
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        // This must exactly match an entry or wildcard in your Redirect URLs list
        redirectTo: `${origin}/app/dashboard` 
      },
    });
  
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-slate-700/70 bg-slate-900/70">
            <img src={appLogo} alt="Super Unemployed logo" className="h-9 w-9 rounded-sm object-cover" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Super Unemployed</h2>
            <p className="text-sm text-slate-400">{isSignUp ? "Create your account to get started." : "Sign in to continue to your workspace."}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 p-1">
          <Button type="button" variant={isSignUp ? "ghost" : "default"} onClick={() => setIsSignUp(false)} className="w-full">
            Sign in
          </Button>
          <Button type="button" variant={isSignUp ? "default" : "ghost"} onClick={() => setIsSignUp(true)} className="w-full">
            Sign up
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={submitEmailAuth}>
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={signInGoogle}>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-slate-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button className="font-medium text-cyan-400 hover:text-cyan-300" onClick={() => setIsSignUp((prev) => !prev)} type="button">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </Card>
    </div>
  );
}
