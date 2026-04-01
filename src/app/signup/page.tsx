// Signup page — supports the credentials auth flow added in C4 fix
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Idiotic Ventures
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Create your account
          </h1>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
