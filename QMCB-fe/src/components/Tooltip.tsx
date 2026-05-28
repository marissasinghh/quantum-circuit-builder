import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fonts } from "../design-tokens";

interface TooltipContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error("Tooltip must be used within a TooltipProvider");
  }
  return ctx;
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      const inside = (target as Element).closest?.("[data-tooltip-root]");
      if (!inside) setOpenId(null);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const value = { openId, setOpenId };
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

export function TooltipMath({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: "#7dd3fc",
      }}
    >
      {children}
    </span>
  );
}

interface TooltipProps {
  id?: string;
  children: ReactNode;
}

export function Tooltip({ id: idProp, children }: TooltipProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const { openId, setOpenId } = useTooltipContext();
  const open = openId === id;
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupRight, setPopupRight] = useState(0);
  const [hovered, setHovered] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setPopupRight(0);
      return;
    }

    const rect = popupRef.current?.getBoundingClientRect();
    if (!rect) return;

    let adjust = 0;
    if (rect.right > window.innerWidth - 8) {
      adjust += rect.right - (window.innerWidth - 8);
    }
    if (rect.left < 8) {
      adjust -= 8 - rect.left;
    }
    setPopupRight(adjust);
  }, [open, children]);

  const toggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setOpenId(open ? null : id);
    },
    [id, open, setOpenId]
  );

  const iconColor = open || hovered ? "#7dd3fc" : "#4a8ab5";

  return (
    <span
      data-tooltip-root
      style={{
        position: "absolute",
        bottom: 6,
        right: 8,
        zIndex: open ? 100 : 1,
      }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="More info"
        aria-expanded={open}
        onClick={toggle}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpenId(open ? null : id);
          }
        }}
        className="italic cursor-pointer select-none"
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 13,
          color: iconColor,
          transition: "color 0.15s",
        }}
      >
        i
      </span>
      {open && (
        <div
          ref={popupRef}
          data-tooltip-root
          style={{
            position: "absolute",
            bottom: 28,
            right: popupRight,
            maxWidth: 280,
            zIndex: 100,
            background: "#0d1226",
            border: "1px solid #1e3a5f",
            borderRadius: 6,
            padding: "10px 12px",
            fontFamily: fonts.mono,
            fontSize: 13,
            lineHeight: 1.6,
            color: "#b0bec5",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            whiteSpace: "normal",
          }}
        >
          {children}
        </div>
      )}
    </span>
  );
}
