import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Login | Kyro",
  description: "Sign in to your Kyro account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
