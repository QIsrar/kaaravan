"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "group toast bg-card text-foreground border-border shadow-lg rounded-2xl",
          title: "text-foreground",
          description: "text-muted-foreground",
          closeButton: "bg-card text-muted-foreground border-border",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
