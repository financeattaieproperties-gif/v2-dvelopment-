import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

export interface CircleMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  color?: string;
}

export interface CircleMenuProps {
  items: CircleMenuItem[];
  radius?: number; // Distance in pixels from center (default 80)
  mode?: "full" | "fan-up" | "fan-left" | "fan-corner"; // Spread angle
  triggerIcon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function CircleMenu({
  items,
  radius = 80,
  mode = "full",
  triggerIcon,
  className,
  buttonClassName,
  ariaLabel = "Quick Action Menu",
}: CircleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const getItemCoordinates = (index: number, total: number) => {
    let angle = 0;
    if (mode === "full") {
      const step = (2 * Math.PI) / total;
      angle = -Math.PI / 2 + index * step;
    } else if (mode === "fan-up") {
      const step = total > 1 ? Math.PI / (total - 1) : 0;
      angle = Math.PI + index * step;
    } else if (mode === "fan-left") {
      const step = total > 1 ? Math.PI / 2 / (total - 1) : 0;
      angle = Math.PI + index * step;
    } else if (mode === "fan-corner") {
      const step = total > 1 ? Math.PI / 2 / (total - 1) : 0;
      angle = -Math.PI + index * step;
    }

    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    return { x, y };
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* Dimmed backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(15, 23, 42, 0.2)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Items */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <AnimatePresence>
          {isOpen &&
            items.map((item, index) => {
              const { x, y } = getItemCoordinates(index, items.length);
              const isHovered = hoveredIndex === index;

              const content = (
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      item.onClick?.();
                    }}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                    animate={{
                      opacity: 1,
                      x,
                      y,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 340,
                        damping: 22,
                        delay: index * 0.035,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 0,
                      y: 0,
                      scale: 0.2,
                      transition: { duration: 0.14 },
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label={item.label}
                    style={{
                      pointerEvents: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "1px solid #E2E8F0",
                      background: isHovered ? "#0072BC" : "#FFFFFF",
                      color: isHovered ? "#FFFFFF" : "#1E293B",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.14)",
                      cursor: "pointer",
                    }}
                  >
                    {item.icon}
                  </motion.button>

                  {isHovered && (
                    <div
                      style={{
                        pointerEvents: "none",
                        position: "absolute",
                        left: "50%",
                        bottom: -28,
                        transform: "translate(calc(-50% + " + x + "px), " + y + "px)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "#1E293B",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.16)",
                        zIndex: 60,
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );

              return (
                <div key={item.label} style={{ position: "absolute" }}>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{ pointerEvents: "auto" }}
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Main Center Trigger Button */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        style={{
          position: "relative",
          zIndex: 50,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid #0072BC",
          background: "#0072BC",
          color: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(0, 114, 188, 0.28)",
          cursor: "pointer",
        }}
      >
        {triggerIcon || <Plus size={20} strokeWidth={2.5} />}
      </motion.button>
    </div>
  );
}

export default CircleMenu;
