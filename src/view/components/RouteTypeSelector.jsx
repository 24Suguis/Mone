import React from "react";

/**
 * RouteTypeSelector — componente que abstrae el <select> existente.
 * Props:
 *  - value: string
 *  - onChange: fn(value)
 *  - id, className (opcionales, passthrough)
 */
export default function RouteTypeSelector({ value = "fastest", onChange = () => {}, id, className }) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Route type"
    >
      <option value="fastest">The Fastest</option>
      <option value="shortest">The Shortest</option>
      <option value="scenic">The Most Economic</option>
    </select>
  );
}