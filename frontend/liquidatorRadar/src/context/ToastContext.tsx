import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const TOAST_DURATION_MS = 15_000;

export type ToastType = "error" | "success" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  expiresAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = nextId++;
      const expiresAt = Date.now() + TOAST_DURATION_MS;
      setToasts((prev) => [...prev, { id, message, type, expiresAt }]);
      setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
