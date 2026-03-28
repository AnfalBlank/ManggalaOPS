import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">ManggalaOPS Login</h1>
          <p className="text-sm text-slate-500 mt-2">Gunakan akun operasional untuk masuk.</p>
          <p className="text-xs text-slate-400 mt-3">Default seed: admin@manggala.co.id / Admin123!</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
