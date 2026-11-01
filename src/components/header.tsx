"use client";

import Link from "next/link";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { ChevronDown, CircleUserRound, LayoutDashboard, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthDialog } from "@/components/auth-dialog";

export function Header() {
  const [open, setOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  async function handleSignOut() {
    setSignOutError("");
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      setSignOutError("Uitloggen is niet gelukt. Probeer het opnieuw.");
    }
  }

  function accountMenu() {
    if (!isSignedIn || !isUserLoaded || !user) return null;

    const displayName = user.fullName || user.firstName || "Mijn account";
    const email = user.primaryEmailAddress?.emailAddress || "";
    const initial = displayName.trim().charAt(0).toUpperCase() || "T";

    return (
      <div className="account-menu" ref={accountMenuRef}>
        <button
          className="account-menu-trigger"
          type="button"
          aria-label="Accountmenu openen"
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
          aria-controls="account-menu-panel"
          onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
        >
          <span className={`account-avatar${user.imageUrl ? "" : " account-avatar-fallback"}`} style={user.imageUrl ? { backgroundImage: `url("${user.imageUrl}")` } : undefined} aria-hidden="true">{user.imageUrl ? null : initial}</span>
          <ChevronDown className="account-menu-chevron" size={15} aria-hidden="true" />
        </button>
        {accountMenuOpen && (
          <div className="account-menu-panel" id="account-menu-panel" role="menu" aria-label="Accountmenu">
            <div className="account-menu-identity">
              <span className={`account-avatar account-avatar-large${user.imageUrl ? "" : " account-avatar-fallback"}`} style={user.imageUrl ? { backgroundImage: `url("${user.imageUrl}")` } : undefined} aria-hidden="true">{user.imageUrl ? null : initial}</span>
              <div className="account-menu-identity-copy">
                <strong>{displayName}</strong>
                {email && <span>{email}</span>}
              </div>
            </div>
            <div className="account-menu-items">
              <Link className="account-menu-item account-menu-dashboard" href="/dashboard" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                <LayoutDashboard size={17} aria-hidden="true" />
                <span>Mijn dashboard</span>
              </Link>
              <Link className="account-menu-item" href="/zoeken" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                <Search size={17} aria-hidden="true" />
                <span>Woningen zoeken</span>
              </Link>
              <button className="account-menu-item" type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); openUserProfile(); }}>
                <Settings size={17} aria-hidden="true" />
                <span>Accountinstellingen</span>
              </button>
              <button className="account-menu-item account-menu-signout" type="button" role="menuitem" onClick={handleSignOut}>
                <LogOut size={17} aria-hidden="true" />
                <span>Uitloggen</span>
              </button>
            </div>
            {signOutError && <p className="account-menu-error" role="alert">{signOutError}</p>}
            <div className="account-menu-footer">ThuisZoek · Jouw plek begint hier</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandLogo />
        <nav className={open ? "main-nav nav-open" : "main-nav"} onClick={() => setOpen(false)}>
          <Link href="/zoeken">Huren</Link><Link href="/zoeken?aanbod=koop">Kopen</Link><Link href="/contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-shortcut" href="/zoeken" aria-label="Zoeken"><Search size={19} /></Link>
          {isLoaded && !isSignedIn && <button className="icon-button auth-icon-button" type="button" aria-label="Inloggen" title="Inloggen" onClick={() => { setOpen(false); setAuthDialogOpen(true); }}><CircleUserRound size={32} strokeWidth={1.6} aria-hidden="true" /></button>}
          {accountMenu()}
          <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Menu sluiten" : "Menu openen"}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {authDialogOpen && <AuthDialog onClose={() => setAuthDialogOpen(false)} />}
    </header>
  );
}
