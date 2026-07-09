import { Logo } from "@/components/common/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8">
        <Logo />
      </div>
      <LoginForm />
    </div>
  );
}
