"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import "./Modal.css";

type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  onClose: () => void;
};

export default function Modal({
  open,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  }

  return (
    <div
      className="ri-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className={`ri-modal ri-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ri-modal-title"
      >
        <header className="ri-modal-header">
          <h2 id="ri-modal-title">
            {title}
          </h2>

          <button
            type="button"
            className="ri-modal-close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ri-modal-body">
          {children}
        </div>

        {footer && (
          <footer className="ri-modal-footer">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}