"use client";

import { useRouter } from "next/navigation";
import { AuthDialog } from "@/components/auth-dialog";

export function AuthRoute({ initialMode }: { initialMode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  return <AuthDialog initialMode={initialMode} onClose={() => router.replace("/")} />;
}
