import Link from "next/link";

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <div><Link className="brand footer-brand" href="/">t<span className="brand-dot">.</span> thuiszoek</Link><p>Een thuis begint met zoeken.</p></div>
    <div className="footer-links"><Link href="/zoeken">Woningen zoeken</Link><Link href="/makelaars">Makelaars</Link><Link href="/tarieven">Voor makelaars</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link></div>
    <span className="copyright">© {new Date().getFullYear()} ThuisZoek.nl</span>
  </div></footer>;
}
