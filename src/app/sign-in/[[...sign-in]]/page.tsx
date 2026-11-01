import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Inloggen" };

export default function SignInPage() {
  return (
    <section className="auth-page">
      <div className="auth-page-copy">
        <span className="eyebrow">Welkom terug</span>
        <h1 className="page-title">Log in bij ThuisZoek</h1>
        <p>Log veilig in om je account en aanvragen te beheren.</p>
        <Link className="text-link" href="/sign-up">Nog geen account? Maak er een aan</Link>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </section>
  );
}
