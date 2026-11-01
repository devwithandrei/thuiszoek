"use client";

import { ReactNode, useState } from "react";

export type AdminSection = {
  id: string;
  label: string;
  count: number;
  content: ReactNode;
};

export function AdminWorkspace({ sections }: { sections: AdminSection[] }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const active = sections.find((section) => section.id === activeSection) ?? sections[0];

  if (!active) return null;

  return (
    <div className="admin-workspace">
      <nav className="admin-tabs" aria-label="Beheeronderdelen">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`admin-tab${active.id === section.id ? " admin-tab-active" : ""}`}
            type="button"
            aria-pressed={active.id === section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.label}</span>
            <span className="admin-tab-count">{section.count}</span>
          </button>
        ))}
      </nav>
      <section className="admin-section" aria-live="polite">
        {active.content}
      </section>
    </div>
  );
}
