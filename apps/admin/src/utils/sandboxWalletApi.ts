import { authRequest } from "@/utils/api/client";

export type AjotiWallet = {
  balance?: { total?: string; reserved?: string; available?: string };
};

export const fundSandboxAjotiWallet = (amountKobo: string, idempotencyKey: string) =>
  authRequest<AjotiWallet>("/api/wallet/sandbox/fund", {
    method: "POST",
    body: JSON.stringify({ amountKobo, idempotencyKey }),
  });
