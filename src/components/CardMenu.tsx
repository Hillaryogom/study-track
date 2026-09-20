import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CardMenuItem {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
}

interface CardMenuProps {
  /** Named so screen-reader users know which record the menu belongs to. */
  label: string;
  items: CardMenuItem[];
}

export function CardMenu({ label, items }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="card-menu" ref={containerRef}>
      <button
        type="button"
        className="icon-button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="card-menu__list" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`card-menu__item${item.tone === "danger" ? " card-menu__item--danger" : ""}`}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
