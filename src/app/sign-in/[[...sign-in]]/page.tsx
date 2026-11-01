import type { Metadata } from "next";
import { AuthRoute } from "@/components/auth-route";

export const metadata: Metadata = { title: "Inloggen" };

export default function SignInPage() {
  return <AuthRoute initialMode="sign-in" />;
}
