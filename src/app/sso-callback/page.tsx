"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

export default function SsoCallbackPage() {
  const router = useRouter();

  return (
    <section className="auth-callback-page" aria-live="polite">
      <div className="auth-callback-card">
        <BrandLogo />
        <div className="auth-callback-spinner" aria-hidden="true" />
        <h1>Aanmelden wordt afgerond</h1>
        <p>Een moment, we brengen je veilig naar ThuisZoek.</p>
        <HandleSSOCallback
          navigateToApp={({ decorateUrl }) => {
            const url = decorateUrl("/dashboard");
            if (url.startsWith("http")) window.location.href = url;
            else router.replace(url);
          }}
          navigateToSignIn={() => router.replace("/sign-in")}
          navigateToSignUp={() => router.replace("/sign-up")}
        />
      </div>
    </section>
  );
}
