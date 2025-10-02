"use client";

import React from "react";
import { BillProvider } from "@/context/BillContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BillProvider>{children}</BillProvider>;
}


