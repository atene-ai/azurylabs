"use client";

import * as React from "react";
import { ConstellationGallery, type ConstellationItem } from "./constellation-gallery";
import "../../styles/team-constellation.css";

export interface TeamItem extends ConstellationItem {
  title: string;
  role: string;
  bio: string;
  href: string;
}

export default function TeamConstellation({ items, lang }: { items: TeamItem[]; lang: "es" | "en" }) {
  const [selected, setSelected] = React.useState(0);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (!items.length) return null;
  const person = items[hovered ?? selected] ?? items[0]!;
  return <div className="team-constellation">
    <div className="team-constellation__visual">
      <ConstellationGallery
        items={items} starSize={mobile ? 64 : 104} drift={mobile ? 0 : 3} seed={37}
        autoplay={false} locale={lang} className="team-constellation__stage"
        onHoverChange={setHovered} onSelect={(index) => setSelected(index)}
        aria-label={lang === "es" ? "Constelación del equipo de Azury Labs" : "Azury Labs team constellation"}
      />
      <p className="team-constellation__hint">
        <span aria-hidden="true">✦</span>
        {lang === "es" ? "Selecciona un retrato para conocer a la persona. Esc para volver." : "Select a portrait to meet the person. Press Esc to return."}
      </p>
    </div>
    <aside className="team-constellation__profile" aria-label={lang === "es" ? "Perfil del equipo" : "Team profile"}>
      <p className="team-constellation__eyebrow">{lang === "es" ? "LAS PERSONAS DETRÁS DE AZURY" : "THE PEOPLE BEHIND AZURY"}</p>
      <div className="team-constellation__person" aria-live="polite" aria-atomic="true">
        <h3>{person.title}</h3>
        <p className="team-constellation__role">{person.role}</p>
        {person.bio && person.bio !== person.role && <p className="team-constellation__bio">{person.bio}</p>}
      </div>
      <a href={person.href} className="team-constellation__link">{lang === "es" ? "Conocer su trayectoria" : "Explore their profile"}<span aria-hidden="true">↗</span></a>
      <p className="team-constellation__count">{items.length} {lang === "es" ? "personas. Una misma visión." : "people. One shared vision."}</p>
    </aside>
  </div>;
}
