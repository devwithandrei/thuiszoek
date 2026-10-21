import type { Metadata } from "next";
import { ContactForm } from "@/components/public-forms";

export const metadata: Metadata = { title: "Contact" };
export default function ContactPage() {
  return <section className="section"><div className="wrap contact-grid"><div><span className="eyebrow">We helpen je graag</span><h1 className="page-title">Neem contact op</h1><p>Een vraag over een woning, jouw account of samenwerken? Stuur ons een bericht. Voor vragen over een specifieke woning kun je het best rechtstreeks contact opnemen met de aanbieder.</p><div className="notice">ThuisZoek.nl · Nederland<br />E-mail: hallo@thuiszoek.nl</div></div><ContactForm /></div></section>;
}
