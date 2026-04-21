import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkName = "TESTNET" | "PUBLIC";

interface WalletState {
  publicKey: string | null;
  network: NetworkName;
  connecting: boolean;
  error: string | null;
  sessionSignerIdByWorkflow: Record<string, string>;
  setConnecting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setWallet: (publicKey: string, network: NetworkName) => void;
  disconnect: () => void;
  rememberSession: (workflowId: string, sessionSignerId: string) => void;
  forgetSession: (workflowId: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      publicKey: null,
      network: "TESTNET",
      connecting: false,
      error: null,
      sessionSignerIdByWorkflow: {},
      setConnecting: (connecting) => set({ connecting }),
      setError: (error) => set({ error }),
      setWallet: (publicKey, network) =>
        set({ publicKey, network, error: null, connecting: false }),
      disconnect: () =>
        set({
          publicKey: null,
          error: null,
          connecting: false,
          sessionSignerIdByWorkflow: {},
        }),
      rememberSession: (workflowId, sessionSignerId) =>
        set((s) => ({
          sessionSignerIdByWorkflow: {
            ...s.sessionSignerIdByWorkflow,
            [workflowId]: sessionSignerId,
          },
        })),
      forgetSession: (workflowId) =>
        set((s) => {
          const next = { ...s.sessionSignerIdByWorkflow };
          delete next[workflowId];
          return { sessionSignerIdByWorkflow: next };
        }),
    }),
    {
      name: "flowpay:wallet",
      partialize: (s) => ({
        publicKey: s.publicKey,
        network: s.network,
        sessionSignerIdByWorkflow: s.sessionSignerIdByWorkflow,
      }),
    }
  )
);
