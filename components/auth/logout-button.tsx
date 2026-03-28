"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        toast.success("Berhasil logout");
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" /> Logout
    </Button>
  );
}
