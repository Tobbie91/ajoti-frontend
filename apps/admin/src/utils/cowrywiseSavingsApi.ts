import { authRequest } from "@/utils/api/client";
import { isDevAuthBypass } from "@/utils/dev-auth-bypass";

export type CowrywiseState = { activated: boolean; testMode: boolean; accountStatus?: string; verificationStatus?: string; verified?: boolean };
export type CowrywiseWallet = { currency: string; balanceMinor: string; status: string; productCode: string; walletId: string; fundingAccountNumberMasked?: string; fundingBankName?: string };
export type CowrywiseOperation = { id: string; type: string; status: string; amountMinor?: string; requestedAt: string; completedAt?: string; failureMessage?: string };
export type CowrywiseSavings = { id: string; productName?: string; productType: string; currency: string; principalAmountMinor: string; accruedReturnAmountMinor: string; status: string; createdAt: string; maturityDate?: string; locked: boolean; operations: CowrywiseOperation[] };

const post = <T>(path: string, body: object = {}) => authRequest<T>(`/api/investments/cowrywise${path}`, { method: "POST", body: JSON.stringify(body) });

const MOCK_KEY = "ajoti_local_cowrywise_mock";
type MockData = { state: CowrywiseState; wallet: CowrywiseWallet; savings: CowrywiseSavings[] };

const initialMockData = (): MockData => ({
  state: { activated: false, testMode: true, accountStatus: "ACTIVE", verificationStatus: "NOT VERIFIED", verified: false },
  wallet: { currency: "NGN", balanceMinor: "0", status: "ACTIVE", productCode: "LOCAL-MOCK", walletId: "local-mock-wallet" },
  savings: [],
});

function readMock(): MockData {
  try {
    const saved = localStorage.getItem(MOCK_KEY);
    return saved ? JSON.parse(saved) as MockData : initialMockData();
  } catch {
    return initialMockData();
  }
}

function writeMock(data: MockData): MockData {
  localStorage.setItem(MOCK_KEY, JSON.stringify(data));
  return data;
}

function mockSavings(data: MockData): CowrywiseSavings[] {
  return data.savings.map((item) => ({ ...item, operations: item.operations.map((operation) => ({ ...operation })) }));
}

export const getCowrywiseState = () => isDevAuthBypass
  ? Promise.resolve(readMock().state)
  : authRequest<CowrywiseState>("/api/investments/cowrywise/state", { method: "GET" });

export const activateCowrywise = () => {
  if (!isDevAuthBypass) return post<CowrywiseState>("/activate");
  const data = readMock();
  data.state.activated = true;
  return Promise.resolve(writeMock(data).state);
};

export const verifyCowrywiseSandboxIdentity = () => {
  if (!isDevAuthBypass) return post<CowrywiseState>("/sandbox/verify-identity");
  const data = readMock();
  data.state.verified = true;
  data.state.verificationStatus = "VERIFIED";
  return Promise.resolve(writeMock(data).state);
};

export const getCowrywiseWallets = () => isDevAuthBypass
  ? Promise.resolve([readMock().wallet])
  : authRequest<CowrywiseWallet[]>("/api/investments/cowrywise/wallets", { method: "GET" });

export const fundCowrywiseSandboxWallet = (amountNaira: string, idempotencyKey: string) => {
  if (!isDevAuthBypass) return post<{status:string}>("/sandbox/fund-wallet", { amountNaira, idempotencyKey });
  const data = readMock();
  data.wallet.balanceMinor = String(Number(data.wallet.balanceMinor) + Math.round(Number(amountNaira) * 100));
  writeMock(data);
  return Promise.resolve({ status: "COMPLETED" });
};

export const getCowrywiseSavings = () => isDevAuthBypass
  ? Promise.resolve(mockSavings(readMock()))
  : authRequest<CowrywiseSavings[]>("/api/investments/cowrywise/savings", { method: "GET" });

export const createCowrywiseLockedSavings = (targetId: string, idempotencyKey: string) => {
  if (!isDevAuthBypass) return post<CowrywiseSavings[]>("/savings/locked", { targetId, days: 90, idempotencyKey });
  const data = readMock();
  const now = new Date();
  const item: CowrywiseSavings = {
    id: `local-mock-savings-${Date.now()}`,
    productName: "Local Mock 90-day Savings",
    productType: "LOCKED_SAVINGS",
    currency: "NGN",
    principalAmountMinor: "0",
    accruedReturnAmountMinor: "0",
    status: "ACTIVE",
    createdAt: now.toISOString(),
    maturityDate: new Date(now.getTime() + 90 * 86_400_000).toISOString(),
    locked: true,
    operations: [],
  };
  data.savings.push(item);
  return Promise.resolve(mockSavings(writeMock(data)));
};

export const fundCowrywiseSavings = (investmentId: string, amountMinor: string, idempotencyKey: string) => {
  if (!isDevAuthBypass) return post<CowrywiseSavings[]>("/savings/fund", { investmentId, amountMinor, idempotencyKey });
  const data = readMock();
  const item = data.savings.find((saving) => saving.id === investmentId);
  if (item) {
    item.principalAmountMinor = String(Number(item.principalAmountMinor) + Number(amountMinor));
    item.operations.push({ id: `local-mock-operation-${Date.now()}`, type: "FUND", status: "COMPLETED", amountMinor, requestedAt: new Date().toISOString(), completedAt: new Date().toISOString() });
  }
  return Promise.resolve(mockSavings(writeMock(data)));
};

export const reconcileCowrywiseOperation = (operationId: string) => {
  if (!isDevAuthBypass) return post<CowrywiseSavings[]>(`/operations/${operationId}/reconcile`);
  const data = readMock();
  data.savings.forEach((saving) => saving.operations.forEach((operation) => {
    if (operation.id === operationId) operation.status = "COMPLETED";
  }));
  return Promise.resolve(mockSavings(writeMock(data)));
};
