"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { ArrowLeft, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";

type AuthMode = "sign-in" | "sign-up";
type AuthStep = "details" | "verification";

export function AuthDialog({
  onClose,
  initialMode = "sign-in",
}: {
  onClose: () => void;
  initialMode?: AuthMode;
}) {
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("details");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fetchStatus = mode === "sign-in" ? signInFetchStatus : signUpFetchStatus;

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  async function finishAuthentication(kind: AuthMode) {
    const navigate = ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
      const url = decorateUrl("/dashboard");
      if (url.startsWith("http")) window.location.href = url;
      else router.replace(url);
    };

    const result = kind === "sign-in"
      ? await signIn.finalize({ navigate })
      : await signUp.finalize({ navigate });

    if (result.error) {
      setError(result.error.message);
      return;
    }
    onClose();
  }

  async function startEmailFlow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const created = await signIn.create({ identifier: email.trim() });
        if (created.error) {
          setError(created.error.message);
          return;
        }
        const sent = await signIn.emailCode.sendCode();
        if (sent.error) {
          setError(sent.error.message);
          return;
        }
      } else {
        if (!legalAccepted) {
          setError("Accepteer de voorwaarden en het privacybeleid om verder te gaan.");
          return;
        }
        const created = await signUp.create({
          emailAddress: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          legalAccepted: true,
        });
        if (created.error) {
          setError(created.error.message);
          return;
        }
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) {
          setError(sent.error.message);
          return;
        }
      }
      setStep("verification");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = mode === "sign-in"
        ? await signIn.emailCode.verifyCode({ code: code.trim() })
        : await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const status = mode === "sign-in" ? signIn.status : signUp.status;
      if (status === "complete") {
        await finishAuthentication(mode);
      } else if (status === "needs_second_factor") {
        setError("Voor dit account is aanvullende tweestapsverificatie vereist. Neem contact met ons op om verder te gaan.");
      } else {
        setError("De verificatie is nog niet afgerond. Controleer de code en probeer het opnieuw.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "De code kon niet worden gecontroleerd. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await signIn.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/dashboard",
      });
      if (result.error) {
        setError(result.error.message);
        setBusy(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inloggen met Google is niet gelukt. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  async function changeMode(nextMode: AuthMode) {
    setError("");
    setNotice("");
    setMode(nextMode);
    setStep("details");
    setCode("");
    setBusy(false);
    try {
      const result = mode === "sign-in" ? await signIn.reset() : await signUp.reset();
      if (result.error) setError(result.error.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "De aanmeldstap kon niet worden gereset.");
    }
  }

  async function editEmail() {
    setError("");
    setNotice("");
    setCode("");
    try {
      const result = mode === "sign-in" ? await signIn.reset() : await signUp.reset();
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setStep("details");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "De verificatie kon niet worden aangepast.");
    }
  }

  const isLoading = busy || fetchStatus === "fetching";

  if (!mounted) return null;

  return createPortal(
    <div className="auth-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" ref={dialogRef} tabIndex={-1}>
        <button className="auth-dialog-close" type="button" onClick={onClose} aria-label="Venster sluiten"><X size={19} /></button>
        <div className="auth-dialog-brand"><BrandLogo /></div>
        {step === "verification" && (
          <button className="auth-dialog-back" type="button" onClick={editEmail}>
            <ArrowLeft size={15} aria-hidden="true" /> E-mailadres aanpassen
          </button>
        )}
        <span className="auth-dialog-kicker">{step === "verification" ? "VEILIGE VERIFICATIE" : "JOUW PLEK BEGINT HIER"}</span>
        <h2 id="auth-dialog-title">
          {step === "verification"
            ? "Controleer je e-mail"
            : mode === "sign-in" ? "Welkom terug" : "Maak je account aan"}
        </h2>
        <p className="auth-dialog-intro">
          {step === "verification"
            ? <>We hebben een eenmalige code gestuurd naar <strong>{email}</strong>.</>
            : mode === "sign-in"
              ? "Log in om je zoektocht, advertenties en aanvragen te beheren."
              : "Maak gratis een account aan en vind of plaats jouw volgende woning."}
        </p>

        {step === "details" && (
          <>
            <button className="auth-google-button" type="button" onClick={continueWithGoogle} disabled={isLoading}>
              {isLoading ? <LoaderCircle className="auth-spinner" size={18} /> : <GoogleMark />}
              <span>Doorgaan met Google</span>
            </button>
            <div className="auth-divider"><span>of met e-mail</span></div>
            <form className="auth-form" onSubmit={startEmailFlow}>
              {mode === "sign-up" && (
                <div className="auth-name-fields">
                  <label className="auth-field">Voornaam
                    <input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                  </label>
                  <label className="auth-field">Achternaam
                    <input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
                  </label>
                </div>
              )}
              <label className="auth-field" htmlFor="auth-email">E-mailadres</label>
              <input
                className="auth-input"
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="jij@voorbeeld.nl"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {mode === "sign-up" && (
                <label className="auth-legal">
                  <input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} required />
                  <span>Ik ga akkoord met de <a href="/voorwaarden" target="_blank" rel="noreferrer">voorwaarden</a> en het <a href="/privacy" target="_blank" rel="noreferrer">privacybeleid</a>.</span>
                </label>
              )}
              <button className="auth-submit-button" type="submit" disabled={isLoading}>
                {isLoading ? <><LoaderCircle className="auth-spinner" size={18} /> Even geduld...</> : "Verder met e-mail"}
              </button>
            </form>
          </>
        )}

        {step === "verification" && (
          <form className="auth-form auth-code-form" onSubmit={verifyEmailCode}>
            <label className="auth-field" htmlFor="auth-code">Eenmalige verificatiecode</label>
            <input
              className="auth-input auth-code-input"
              id="auth-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\s/g, ""))}
              required
              autoFocus
            />
            <button className="auth-submit-button" type="submit" disabled={isLoading}>
              {isLoading ? <><LoaderCircle className="auth-spinner" size={18} /> Controleren...</> : "Code bevestigen"}
            </button>
            <button className="auth-resend-button" type="button" disabled={isLoading} onClick={async () => {
              setError("");
              try {
                const result = mode === "sign-in"
                  ? await signIn.emailCode.sendCode()
                  : await signUp.verifications.sendEmailCode();
                if (result.error) setError(result.error.message);
                else setNotice("Er is een nieuwe code verstuurd.");
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "De code kon niet opnieuw worden verstuurd.");
              }
            }}>Stuur een nieuwe code</button>
          </form>
        )}

        {error && <p className="auth-dialog-error" role="alert">{error}</p>}
        {notice && <p className="auth-dialog-notice" role="status">{notice}</p>}
        <div className="auth-dialog-assurance"><ShieldCheck size={16} aria-hidden="true" /><span>Je gegevens worden veilig verwerkt</span></div>
        <div className="auth-dialog-switch">
          {mode === "sign-in" ? "Nog geen account?" : "Heb je al een account?"}{" "}
          <button type="button" onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
            {mode === "sign-in" ? "Account aanmaken" : "Inloggen"}
          </button>
        </div>
        <div id="clerk-captcha" />
      </div>
    </div>,
    document.body,
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
      <path fill="#4285F4" d="M21.35 12.22c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.7 2.91-4.2 2.91-7.29Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.52c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.71-5.47-4.01H3.28v2.6A9.74 9.74 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.53 13.79a5.85 5.85 0 0 1 0-3.58V7.61H3.28a9.75 9.75 0 0 0 0 8.78l3.25-2.6Z" />
      <path fill="#EA4335" d="M12 6.2c1.43 0 2.71.49 3.72 1.47l2.8-2.8C16.84 3.26 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.72 5.36l3.25 2.6C7.3 7.91 9.46 6.2 12 6.2Z" />
    </svg>
  );
}
