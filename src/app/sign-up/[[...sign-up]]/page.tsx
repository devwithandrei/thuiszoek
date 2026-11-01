import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Account aanmaken" };

export default function SignUpPage() {
  return (
    <section className="auth-page">
      <div className="auth-page-copy">
        <span className="eyebrow">Start vandaag</span>
        <h1 className="page-title">Maak je ThuisZoek-account</h1>
        <p>Maak gratis een account aan om woningen te ontdekken en contact op te nemen.</p>
        <Link className="text-link" href="/sign-in">Heb je al een account? Log in</Link>
      </div>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </section>
  );
}
