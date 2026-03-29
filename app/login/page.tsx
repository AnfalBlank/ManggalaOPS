import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl border">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-5">
            <Image src="/manggala-logo.png" alt="Logo PT. Manggala Utama Indonesia" width={168} height={168} className="h-40 w-40 object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 whitespace-nowrap">PT. Manggala Utama Indonesia</h1>
          <p className="text-lg font-semibold text-primary mt-2">ManggalaOPS</p>
          <p className="text-sm text-slate-500 mt-3 leading-6 max-w-xl mx-auto">
            Pusat kendali operasional untuk mengelola client, penawaran, proyek, invoicing, keuangan, dan koordinasi internal PT. Manggala Utama Indonesia secara lebih rapi, cepat, dan terintegrasi. Silakan login menggunakan akun yang telah dibuat administrator.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
