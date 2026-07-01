import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Login | Kyro",
  description: "Sign in to your Kyro account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Subtle grid, masked to a soft radial fade */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[32px_32px] opacity-60 mask-[radial-gradient(ellipse_60%_55%_at_50%_45%,#000_60%,transparent_100%)]"
      />
      {/* Brand glow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 size-112 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
