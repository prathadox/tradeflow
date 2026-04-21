import {
  isConnected,
  requestAccess,
  getNetwork,
} from "@stellar/freighter-api";
import type { NetworkName } from "../store/walletStore";

function toNetworkName(raw: string | undefined): NetworkName {
  if (raw === "PUBLIC") return "PUBLIC";
  return "TESTNET";
}

export interface FreighterConnectResult {
  publicKey: string;
  network: NetworkName;
}

export async function connectFreighter(): Promise<FreighterConnectResult> {
  const installed = await isConnected();
  if (!installed.isConnected) {
    throw new Error(
      "Freighter extension not detected. Install it from https://freighter.app and retry."
    );
  }
  const access = await requestAccess();
  if (access.error || !access.address) {
    throw new Error(access.error ?? "Wallet access was not granted");
  }
  const net = await getNetwork();
  if (net.error) {
    throw new Error(net.error);
  }
  return {
    publicKey: access.address,
    network: toNetworkName(net.network),
  };
}
