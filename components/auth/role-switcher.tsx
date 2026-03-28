"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labels: Record<string, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export function RoleSwitcher() {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/role")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role);
        setRoles(data.roles);
      });
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white shadow-sm">
      <ShieldCheck className="size-4 text-primary" />
      <Select
        value={role}
        onValueChange={async (value) => {
          if (!value) return;
          const response = await fetch("/api/auth/role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: value }),
          });
          const payload = await response.json();
          if (!response.ok) {
            toast.error(payload.error ?? "Gagal ganti role");
            return;
          }
          setRole(value);
          toast.success(`Role aktif: ${labels[value] ?? value}`);
          router.refresh();
        }}
      >
        <SelectTrigger className="w-[180px] border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((item) => (
            <SelectItem key={item} value={item}>
              {labels[item] ?? item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
