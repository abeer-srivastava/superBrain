"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: true, errorRetryCount: 2 }}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "!rounded-none !bg-ink !text-paper !border-0 ! !shadow-lg !font-sans",
            description: "!text-paper/70",
            actionButton: "!rounded-none !bg-paper !text-ink",
          },
        }}
      />
    </SWRConfig>
  );
}
