import type React from "react";

export function numericKeyDownGuard(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
  }
  if (
    !/[0-9]/.test(e.key) &&
    e.key !== "." &&
    e.key !== "Backspace" &&
    e.key !== "Delete" &&
    e.key !== "Tab" &&
    e.key !== "Escape" &&
    e.key !== "Enter" &&
    !e.ctrlKey
  ) {
    e.preventDefault();
  }
}


