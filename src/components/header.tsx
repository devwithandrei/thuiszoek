"use client";

import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="ThuisZoek home">
          <span className="brand-mark">t</span> thuiszoek<span className="brand-dot">.</span>
        </Link>
        <nav className={open ? "main-nav nav-open" : "main-nav"} onClick={() => setOpen(false)}>
          <Link href="/zoeken">Huren</Link><Link href="/zoeken?aanbod=koop">Kopen</Link>
          <Link href="/makelaars">Makelaars</Link><Link href="/tarieven">Voor makelaars</Link>
          {isLoaded && !isSignedIn && <div className="mobile-nav-account"><SignInButton mode="modal"><button className="button button-outline">Inloggen</button></SignInButton><Link className="button button-primary" href="/tarieven">Plaats woning</Link></div>}
          {isSignedIn && <div className="mobile-nav-account"><Link className="button button-primary" href="/dashboard">Dashboard</Link><UserButton /></div>}
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-shortcut" href="/zoeken" aria-label="Zoeken"><Search size={19} /></Link>
          <div className="desktop-auth-actions">
            {isLoaded && !isSignedIn && <><SignInButton mode="modal"><button className="button button-outline button-small">Inloggen</button></SignInButton><Link className="button button-primary button-small" href="/tarieven">Plaats woning</Link></>}
            {isSignedIn && <><Link className="button button-primary button-small" href="/dashboard">Dashboard</Link><UserButton /></>}
          </div>
          <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Menu sluiten" : "Menu openen"}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
  );
}
