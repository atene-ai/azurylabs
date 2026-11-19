"use client";
import { ConstellationGallery, type ConstellationItem } from "./constellation-gallery";
const settings = { autoplay: true, autoplayInterval: 8300, starSize: 85, drift: 10 };
const PHOTOS = [
  { id: "photo-1488972685288-c3fd157d7c7a", title: "White stair", tags: ["modern", "shadow", "curves"] },
  { id: "photo-1546414701-81cc6963c67f", title: "Raw tower", tags: ["concrete", "light"] },
  { id: "photo-1614159869126-0f06a742eecb", title: "Cloister", tags: ["arches", "shadow"] },
  { id: "photo-1523477593243-78bbf626fd3b", title: "Mirror wall", tags: ["glass", "light", "curves"] },
  { id: "photo-1479839672679-a46483c0e7c8", title: "Clean edge", tags: ["modern", "shadow"] },
  { id: "photo-1504625709867-b4e45e3bb9dd", title: "Grey block", tags: ["concrete", "light"] },
  { id: "photo-1547612403-81da6259bdaf", title: "Stone arcade", tags: ["arches", "shadow", "curves"] },
  { id: "photo-1490351267196-b7a67e26e41b", title: "Blue grid", tags: ["glass", "light"] },
  { id: "photo-1527576539890-dfa815648363", title: "Sun deck", tags: ["modern", "shadow"] },
  { id: "photo-1737442981890-0a87ef3ce9f5", title: "Concrete wave", tags: ["concrete", "light", "curves"] },
  { id: "photo-1599089245397-ba66755081f4", title: "Vaulted hall", tags: ["arches", "shadow"] },
  { id: "photo-1554469384-e58fac16e23a", title: "Glass canyon", tags: ["glass", "light"] },
  { id: "photo-1487958449943-2429e8be8625", title: "Quiet lobby", tags: ["modern", "shadow", "curves"] },
  { id: "photo-1446771326090-d910bfaf00f6", title: "Monolith", tags: ["concrete", "light"] },
];
const ITEMS: ConstellationItem[] = PHOTOS.map(({ id, title, tags }) => ({ src: `https://images.unsplash.com/${id}?w=320&h=320&fit=crop&q=80&auto=format`, alt: title, title, tags }));
export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background p-6">
    <ConstellationGallery items={ITEMS} autoplay={s.autoplay} autoplayInterval={s.autoplayInterval} starSize={s.starSize} drift={s.drift} className="max-w-3xl" />
    <p className="text-xs text-muted-foreground">Hover a photo to see its constellation, click to gather it.{" "}
      <a href="https://ccgather.com/?utm_source=21st&utm_medium=component&utm_campaign=constellation_gallery" target="_blank" rel="noreferrer" className="underline underline-offset-4 transition-colors hover:text-foreground">By the CCgather team</a>
    </p>
  </div>;
}
