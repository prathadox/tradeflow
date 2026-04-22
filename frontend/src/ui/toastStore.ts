import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  text: string;
  createdAt: number;
}

interface ToastState {
  items: ToastItem[];
  push: (tone: ToastTone, text: string) => void;
  dismiss: (id: number) => void;
}

let seq = 1;

export const useToast = create<ToastState>((set, get) => ({
  items: [],
  push: (tone, text) => {
    const id = seq++;
    set((s) => ({
      items: [...s.items, { id, tone, text, createdAt: Date.now() }],
    }));
    window.setTimeout(() => get().dismiss(id), 3600);
  },
  dismiss: (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (text: string) => useToast.getState().push("success", text),
  error: (text: string) => useToast.getState().push("error", text),
  info: (text: string) => useToast.getState().push("info", text),
};
