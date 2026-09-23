import { authRequest } from "@/utils/api/client";

export type CowrywiseState = { activated: boolean; testMode: boolean; accountStatus?: string; verificationStatus?: string; verified?: boolean };
export type CowrywiseWallet = { currency: string; balanceMinor: string; status: string; productCode: string; walletId: string; fundingAccountNumberMasked?: string; fundingBankName?: string };
export type CowrywiseOperation = { id: string; type: string; status: string; amountMinor?: string; requestedAt: string; completedAt?: string; failureMessage?: string };
export type CowrywiseSavings = { id: string; productName?: string; productType: string; currency: string; principalAmountMinor: string; accruedReturnAmountMinor: string; status: string; createdAt: string; maturityDate?: string; locked: boolean; operations: CowrywiseOperation[] };

const post = <T>(path: string, body: object = {}) => authRequest<T>(`/api/investments/cowrywise${path}`, { method: "POST", body: JSON.stringify(body) });
export const getCowrywiseState = () => authRequest<CowrywiseState>("/api/investments/cowrywise/state", { method: "GET" });
export const activateCowrywise = () => post<CowrywiseState>("/activate");
export const verifyCowrywiseSandboxIdentity = () => post<CowrywiseState>("/sandbox/verify-identity");
export const getCowrywiseWallets = () => authRequest<CowrywiseWallet[]>("/api/investments/cowrywise/wallets", { method: "GET" });
export const fundCowrywiseSandboxWallet = (amountNaira: string, idempotencyKey: string) => post<{status:string}>("/sandbox/fund-wallet", { amountNaira, idempotencyKey });
export const getCowrywiseSavings = () => authRequest<CowrywiseSavings[]>("/api/investments/cowrywise/savings", { method: "GET" });
export const createCowrywiseLockedSavings = (targetId: string, idempotencyKey: string) => post<CowrywiseSavings[]>("/savings/locked", { targetId, days: 90, idempotencyKey });
export const fundCowrywiseSavings = (investmentId: string, amountMinor: string, idempotencyKey: string) => post<CowrywiseSavings[]>("/savings/fund", { investmentId, amountMinor, idempotencyKey });
export const reconcileCowrywiseOperation = (operationId: string) => post<CowrywiseSavings[]>(`/operations/${operationId}/reconcile`);
