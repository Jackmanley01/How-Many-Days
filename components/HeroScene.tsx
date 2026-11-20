/** The drawn hills-and-sun scene behind page headers. Decorative only. */
export function HeroScene() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] w-full"
      viewBox="0 0 390 200"
      preserveAspectRatio="xMidYMax slice"
    >
      <circle cx="352" cy="40" r="26" className="fill-brand-sun" />
      <path d="M0 200 L0 128 L70 80 L130 126 L205 52 L282 132 L332 100 L390 136 L390 200Z" className="fill-brand-mid" />
      <path d="M0 200 L0 168 L90 124 L172 168 L252 120 L330 166 L390 150 L390 200Z" className="fill-brand" />
    </svg>
  );
}
