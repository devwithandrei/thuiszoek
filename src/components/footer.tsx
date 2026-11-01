import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <div><BrandLogo footer /><p>Een thuis begint met zoeken.</p></div>
    <div className="footer-links"><Link href="/zoeken">Woningen zoeken</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link></div>
    <span className="copyright">© {new Date().getFullYear()} ThuisZoek.nl</span>
  </div></footer>;
}
