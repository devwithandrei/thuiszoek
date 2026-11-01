import Link from "next/link";
import { Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <div className="footer-brand-block"><BrandLogo footer /><p>Een thuis begint met zoeken.<Link className="footer-search-link" href="/zoeken" aria-label="Woningen zoeken" title="Woningen zoeken"><Search size={16} aria-hidden="true" /></Link></p></div>
    <nav className="footer-links" aria-label="Footer navigatie"><Link href="/over-ons">Over ons</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link></nav>
    <span className="copyright">© {new Date().getFullYear()} ThuisZoek.nl</span>
  </div></footer>;
}
