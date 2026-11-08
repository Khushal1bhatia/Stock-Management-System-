"use client";

import { useEffect, useRef } from "react";

export function useShowModal(focusSelector = "[data-autofocus]") {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const timer = window.setTimeout(() => {
      dialog.querySelector<HTMLElement>(focusSelector)?.focus();
    }, 40);
    return () => {
      window.clearTimeout(timer);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [focusSelector]);

  return ref;
}

export function handleBackdropClick(
  event: React.MouseEvent<HTMLDialogElement>,
  onClose: () => void
) {
  if (event.target === event.currentTarget) onClose();
}
