"use client";

import { ColorFilterGallery } from "@/components/ui/color-filter-gallery";
import type { ColorFilterItem, ColorName } from "@/components/ui/color-filter-gallery";

const settings = { autoplay: true, interval: 2800, bloomDuration: 750, columns: 4 };
const PHOTOS: Array<{ id: string; title: string; color: ColorName }> = [
  { id: "photo-1644088302289-29e0a0c6a36b", title: "Lantern street", color: "red" },
  { id: "photo-1559617519-66f3814bfdb3", title: "Blue alley", color: "blue" },
  { id: "photo-1595756035507-995aad5d5de3", title: "Sunflower field", color: "yellow" },
  { id: "photo-1530092140914-77b08774835e", title: "Flamingo", color: "pink" },
  { id: "photo-1495758874721-e9da827a0581", title: "Fern", color: "green" },
  { id: "photo-1623867452962-d2a44d65dd79", title: "Red parasol", color: "red" },
  { id: "photo-1595562161314-4ed3f3503826", title: "Lavender", color: "purple" },
  { id: "photo-1518614768202-663a3a0ecf59", title: "Vintage cab", color: "yellow" },
  { id: "photo-1558286598-73a6be5c16b0", title: "Blue door", color: "blue" },
  { id: "photo-1522383225653-ed111181a951", title: "Cherry blossom", color: "pink" },
  { id: "photo-1610047629542-464f7210209a", title: "Dune by the sea", color: "orange" },
  { id: "photo-1480996408299-fc0e830b5db1", title: "Rice terraces", color: "green" },
];
const ITEMS: ColorFilterItem[] = PHOTOS.map(({ id, title, color }) => ({
  src: `https://images.unsplash.com/${id}?w=640&h=512&fit=crop&q=80&auto=format`, alt: title, title, color,
}));
const CCGATHER_URL = "https://ccgather.com/?utm_source=21st&utm_medium=component&utm_campaign=color_filter_gallery";
export default function Demo(props: Partial<typeof settings> & { autoDetect?: boolean }) {
  const { autoDetect, ...overrides } = props;
  const s = { ...settings, ...overrides };
  const items = autoDetect ? ITEMS.map(({ color: _color, ...rest }) => rest) : ITEMS;
  return <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background p-6 text-foreground">
    <ColorFilterGallery items={items} autoplay={s.autoplay} interval={s.interval} bloomDuration={s.bloomDuration} columns={s.columns} className="max-w-3xl" />
    <p className="text-xs text-muted-foreground">Pick a color and the photos that carry it bloom out of black and white. Click a photo to see more in its color.{" "}
      <a href={CCGATHER_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 transition-colors hover:text-foreground">By the CCgather team</a>
    </p>
  </div>;
}
