import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, House, UsersRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Over ons",
  description: "Lees waar ThuisZoek voor staat: een toegankelijk en transparant platform om een plek te vinden of vastgoed aan te bieden.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Over ThuisZoek</span>
          <h1 className="page-title">Een plek vinden begint met vertrouwen.</h1>
          <p>ThuisZoek brengt woningzoekers en aanbieders samen op één overzichtelijk platform voor huren en kopen in Nederland.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap about-content">
          <div className="about-intro">
            <h2>Vastgoed zoeken, helder geregeld</h2>
            <p>Een nieuwe woning vinden of een pand aanbieden is een grote stap. Daarom bouwen we aan een plek waar aanbod duidelijk wordt gepresenteerd en contact tussen woningzoekers en aanbieders eenvoudig begint.</p>
            <p>Op ThuisZoek kunnen bezoekers woningen en bedrijfspanden te huur en te koop ontdekken. Particuliere aanbieders en makelaars kunnen hun aanbod beheren via hun eigen Studio.</p>
          </div>
          <div className="about-values">
            <article className="about-value-card">
              <span className="about-value-icon"><House size={21} aria-hidden="true" /></span>
              <h3>Een platform voor iedereen</h3>
              <p>Of je nu een thuis zoekt of vastgoed aanbiedt: je vindt de belangrijkste stappen op één plek.</p>
            </article>
            <article className="about-value-card">
              <span className="about-value-icon"><BadgeCheck size={21} aria-hidden="true" /></span>
              <h3>Duidelijkheid voorop</h3>
              <p>We werken aan overzichtelijke advertenties en een zorgvuldige beoordeling van nieuw aanbod.</p>
            </article>
            <article className="about-value-card">
              <span className="about-value-icon"><UsersRound size={21} aria-hidden="true" /></span>
              <h3>Direct contact</h3>
              <p>Woningzoekers kunnen via een advertentie rechtstreeks een vraag sturen aan de aanbieder.</p>
            </article>
          </div>
          <div className="about-cta">
            <div><h2>Wil je meer weten?</h2><p>We helpen je graag met vragen over ThuisZoek of samenwerken.</p></div>
            <Link className="button button-primary" href="/contact">Neem contact op <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
