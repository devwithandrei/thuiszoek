import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tarieven voor makelaars" };
const plans = [
  { title: "Basic", count: "1 actieve advertentie", note: "Voor zelfstandige aanbieders", items: ["Eigen makelaarspagina", "Enquiries ontvangen", "Advertentiebeheer"] },
  { title: "Pro", count: "10 actieve advertenties", note: "Voor groeiende kantoren", items: ["Alles uit Basic", "Tot 10 actieve advertenties", "Inzicht in aanvragen"] },
  { title: "Expert Pro Max", count: "Onbeperkt adverteren", note: "Voor grote teams", items: ["Alles uit Pro", "Onbeperkt aanbod", "Prioriteit bij support"] },
];
export default function PricingPage() {
  return <><section className="page-hero"><div className="wrap"><span className="eyebrow">Tarieven</span><h1 className="page-title">Meer zichtbaar. Geen kosten.</h1><p>ThuisZoek is bij de lancering voor alle makelaars gratis. Geen betaalgegevens nodig en geen automatische verlenging.</p></div></section><section className="section"><div className="wrap"><div className="plan-grid">{plans.map((plan, i) => <article className={`plan-card ${i === 1 ? "highlight" : ""}`} key={plan.title}><h3>{plan.title}</h3><p>{plan.note}</p><div className="plan-price">Gratis</div><strong>{plan.count}</strong><ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul><Link className="button button-primary" href="/contact">Interesse? Neem contact op</Link></article>)}</div><div className="notice">Toekomstige premiumfuncties voor woningzoekers zijn nog niet beschikbaar. Een eventuele proefperiode van 7 dagen en prijs van € 14,99 per maand worden pas aangeboden nadat facturering expliciet is ingeschakeld. Er worden nu geen betalingen of abonnementen gestart.</div></div></section></>;
}
