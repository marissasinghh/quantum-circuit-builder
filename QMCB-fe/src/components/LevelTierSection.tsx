import type { ReactNode } from "react";

interface LevelTierSectionProps<T> {
  title: string;
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
}

export function LevelTierSection<T>({
  title,
  items,
  getKey,
  renderCard,
}: LevelTierSectionProps<T>) {
  return (
    <section className="space-y-4">
      <h2 className="tier-section-title">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
      </div>
    </section>
  );
}
