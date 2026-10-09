/**
 * Fixed backdrop: editorial column guides aligned to the page container,
 * plus a faint red bloom off the top edge. Texture, never decoration.
 */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 420px at 85% -8%, rgba(227,20,27,0.07), transparent 70%)",
        }}
      />
      <div className="wrap relative grid h-full grid-cols-2 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-full border-l border-[rgba(244,242,238,0.035)] ${i > 1 ? "hidden md:block" : ""} ${
              i === 3 || (i === 1) ? "md:border-r-0" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
