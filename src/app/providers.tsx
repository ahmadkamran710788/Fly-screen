'use client';

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrderProvider>
        {children}
        <Toaster />
      </OrderProvider>
    </AuthProvider>
  );
}


