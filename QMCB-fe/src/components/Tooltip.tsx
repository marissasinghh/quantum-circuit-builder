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
import { createPortal } from "react-dom";
import { fonts } from "../design-tokens";

const TOOLTIP_MARGIN = 8;
const TOOLTIP_GAP = 22;
const TOOLTIP_MAX_WIDTH = 340;

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

export function useTooltip() {
  return useTooltipContext();
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
  bottom?: number;
  right?: number;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
}

function clampPopupPosition(
  triggerRect: DOMRect,
  popupWidth: number,
  popupHeight: number
): PopupPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(TOOLTIP_MAX_WIDTH, popupWidth, vw - TOOLTIP_MARGIN * 2);

  let left = triggerRect.right - width;
  let top = triggerRect.top - popupHeight - TOOLTIP_GAP;

  if (left < TOOLTIP_MARGIN) left = TOOLTIP_MARGIN;
  if (left + width > vw - TOOLTIP_MARGIN) left = vw - TOOLTIP_MARGIN - width;

  if (top < TOOLTIP_MARGIN) top = triggerRect.bottom + TOOLTIP_GAP;
  if (top + popupHeight > vh - TOOLTIP_MARGIN) {
    top = Math.max(TOOLTIP_MARGIN, vh - TOOLTIP_MARGIN - popupHeight);
  }

  return { top, left, width };
}

export function Tooltip({ id: idProp, children, bottom = 6, right = 8 }: TooltipProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const { openId, setOpenId } = useTooltipContext();
  const open = openId === id;
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<PopupPosition | null>(null);
  const [hovered, setHovered] = useState(false);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;

    const triggerRect = trigger.getBoundingClientRect();
    const width = Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - TOOLTIP_MARGIN * 2);
    popup.style.width = `${width}px`;

    const height = popup.offsetHeight;
    setPopupPos(clampPopupPosition(triggerRect, width, height));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPopupPos(null);
      return;
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);

    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, children, updatePosition]);

  const toggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setOpenId(open ? null : id);
    },
    [id, open, setOpenId]
  );

  const iconColor = open || hovered ? "#7dd3fc" : "#4a8ab5";

  const popup =
    open &&
    createPortal(
      <div
        ref={popupRef}
        data-tooltip-root
        style={{
          position: "fixed",
          top: popupPos?.top ?? -9999,
          left: popupPos?.left ?? -9999,
          width: popupPos?.width ?? TOOLTIP_MAX_WIDTH,
          visibility: popupPos ? "visible" : "hidden",
          maxWidth: TOOLTIP_MAX_WIDTH,
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
      </div>,
      document.body
    );

  return (
    <>
      <span
        ref={triggerRef}
        data-tooltip-root
        style={{
          position: "absolute",
          bottom,
          right,
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
      </span>
      {popup}
    </>
  );
}
