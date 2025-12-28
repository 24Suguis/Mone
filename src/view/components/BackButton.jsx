import React from "react";
import { useNavigate } from "react-router-dom";

const ARROW_PATH = "M14.5 4.5 8 11l6.5 6.5-1.5 1.5L5 11l8-8z";

export default function BackButton({ label = "Back", onClick, style, className }) {
  const navigate = useNavigate();

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
      return;
    }
    navigate(-1);
  };

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "transparent",
    border: "none",
    padding: "0.25rem 0",
    color: "var(--color-text, --color-primary, #000)",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{ ...baseStyle, ...style }}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d={ARROW_PATH} fill="currentColor" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
