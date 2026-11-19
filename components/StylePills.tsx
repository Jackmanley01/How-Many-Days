"use client";

export type PillOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: PillOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  label: string;
};

/** A row of toggle pills. Real buttons with aria-pressed; 44px tall. */
export function StylePills<T extends string>({ options, selected, onSelect, label }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === selected;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(o.value)}
            className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold transition-colors ${
              on ? "border-brand bg-brand-tint text-brand-text" : "border-border bg-surface text-ink hover:border-brand"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
