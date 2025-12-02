import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable action buttons for list items.
 *
 * Props:
 * - id: item identifier (optional)
 * - editTarget: string route prefix (e.g. "/edit-place") or function(id) => path
 * - onEdit: callback (id) => void (overrides editTarget if provided)
 * - onDelete: callback (id) => void
 *
 * Behavior:
 * - If onEdit provided, it is called with id.
 * - Else if editTarget provided as function/string, navigates to the computed path.
 */
export default function EditDeleteActions({ id, editTarget, onEdit, onDelete }) {
  const navigate = useNavigate();

  const handleEdit = (e) => {
    e.stopPropagation();
    if (typeof onEdit === "function") return onEdit(id);
    if (!editTarget) return;
    const path = typeof editTarget === "function" ? editTarget(id) : `${editTarget}${id ? `/${id}` : ""}`;
    navigate(path);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (typeof onDelete === "function") return onDelete(id);
    // fallback: emit console warning so developer notices missing handler
    console.warn("ItemActions: onDelete not provided for id:", id);
  };

  return (
    <div className="item-card__actions">
      <button
        type="button"
        className="item-card_button"
        title="Edit"
        aria-label="Edit item"
        onClick={handleEdit}
      >
        ✎
      </button>

      <button
        type="button"
        className="item-card_button"
        title="Delete"
        aria-label="Delete item"
        onClick={handleDelete}
      >
        🗑
      </button>
    </div>
  );
}