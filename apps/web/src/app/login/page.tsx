import { Terminal } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Login | Kyro",
  description: "Sign in to your Kyro account",
};

export default function LoginPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Panel: Visuals & Branding (Hidden on smaller screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-zinc-950 p-12 lg:flex">
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />

        {/* Animated Aurora / Glow Effects */}
        <div className="absolute -top-1/4 -left-1/4 size-[800px] rounded-full bg-brand/20 blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-info/20 blur-[100px] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-1/4 -right-1/4 size-[800px] rounded-full bg-brand/10 blur-[120px] opacity-50 pointer-events-none" />

        {/* Logo (Top) */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-zinc-950">
            <Terminal className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Kyro
          </span>
        </div>

        {/* Copy (Bottom) */}
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold tracking-tighter text-white">
            Deploy with confidence.
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-md leading-relaxed">
            Push your code to Git and let our infrastructure handle the rest.
            Seamless, instant, and secure.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Interaction */}
      <div className="flex w-full flex-col justify-center px-4 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo (only visible on mobile) */}
          <div className="mb-10 flex justify-center lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Terminal className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Kyro</span>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
