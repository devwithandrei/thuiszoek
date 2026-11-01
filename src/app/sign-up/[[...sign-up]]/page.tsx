import type { Metadata } from "next";
import { AuthRoute } from "@/components/auth-route";

export const metadata: Metadata = { title: "Account aanmaken" };

export default function SignUpPage() {
  return <AuthRoute initialMode="sign-up" />;
}
