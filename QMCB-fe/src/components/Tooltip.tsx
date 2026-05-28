import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TooltipProps {
  text: string;
  className?: string;
}

export function Tooltip({ text, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [shiftX, setShiftX] = useState(0);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setShiftX(0);
      return;
    }

    const rect = tooltipRef.current?.getBoundingClientRect();
    if (!rect) return;

    const overflow = rect.right - (window.innerWidth - 8);
    setShiftX(overflow > 0 ? -overflow : 0);
  }, [open, text]);

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        marginLeft: 6,
      }}
    >
      <button
        type="button"
        aria-label="More info"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "transparent",
          border: "1px solid #546e7a",
          color: "#546e7a",
          fontFamily: "Space Mono, monospace",
          fontSize: 9,
          fontWeight: 700,
          cursor: "pointer",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#4fc3f7";
          e.currentTarget.style.color = "#4fc3f7";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#546e7a";
          e.currentTarget.style.color = "#546e7a";
        }}
      >
        i
      </button>
      {open && (
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: `translateX(calc(-50% + ${shiftX}px))`,
            zIndex: 50,
            background: "#0d1226",
            border: "1px solid #1e3a5f",
            borderRadius: 6,
            padding: "10px 12px",
            maxWidth: 260,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#b0bec5",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            marginBottom: 6,
            whiteSpace: "normal",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
