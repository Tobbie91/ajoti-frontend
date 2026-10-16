import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconPlus, IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import {
  createAcquisitionSource,
  createFinanceExpense,
  createFinanceExpenseCategory,
  deactivateAcquisitionSource,
  deactivateFinanceExpenseCategory,
  getFinanceReport,
  listAcquisitionSources,
  listFinanceExpenseCategories,
  listFinanceExpenses,
  voidFinanceExpense,
  type AcquisitionSourceRow,
  type FinanceDateWindow,
  type FinanceExpenseCategoryRow,
  type FinanceExpenseRow,
  type FinanceReport,
} from "@/utils/api";
import { getStaffRoleFromStorage, hasPermission } from "@/utils/permissions";

function inputDate(date: Date) {
  const values = new Map(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function initialWindow() {
  const today = inputDate(new Date());
  return { startDate: `${today.slice(0, 7)}-01`, endDate: today };
}

function fmtKobo(kobo: string | null) {
  if (kobo === null) return "N/A";
  return `₦${(Number(kobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="xs" c="dimmed">
        {title}
      </Text>
      <Text fw={700} size="lg" mt={4}>
        {value}
      </Text>
      {detail && (
        <Text size="xs" c="dimmed" mt={3}>
          {detail}
        </Text>
      )}
    </Paper>
  );
}

export function FinanceReports() {
  const canManage = hasPermission(
    getStaffRoleFromStorage(),
    "MANAGE_SYSTEM_ACCOUNTS",
  );
  const [dateWindow, setDateWindow] =
    useState<FinanceDateWindow>(initialWindow);
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [expenses, setExpenses] = useState<FinanceExpenseRow[]>([]);
  const [sources, setSources] = useState<AcquisitionSourceRow[]>([]);
  const [categories, setCategories] = useState<FinanceExpenseCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceOpened, setSourceOpened] = useState(false);
  const [categoryOpened, setCategoryOpened] = useState(false);
  const [expenseOpened, setExpenseOpened] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [amountNaira, setAmountNaira] = useState<number | "">("");
  const [incurredAt, setIncurredAt] = useState(inputDate(new Date()));
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [financeReport, expenseRows, sourceRows, categoryRows] =
        await Promise.all([
          getFinanceReport(dateWindow),
          listFinanceExpenses(dateWindow),
          listAcquisitionSources(),
          listFinanceExpenseCategories(),
        ]);
      setReport(financeReport);
      setExpenses(expenseRows);
      setSources(sourceRows);
      setCategories(categoryRows);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load finance reports",
      );
    } finally {
      setLoading(false);
    }
  }, [dateWindow]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSource() {
    if (!sourceName.trim() || !trackingCode.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createAcquisitionSource({
        name: sourceName.trim(),
        trackingCode: trackingCode.trim(),
      });
      setSourceName("");
      setTrackingCode("");
      setSourceOpened(false);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save campaign source",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    if (!categoryName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createFinanceExpenseCategory({ name: categoryName.trim() });
      setCategoryName("");
      setCategoryOpened(false);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save expense category",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveExpense() {
    if (
      !amountNaira ||
      amountNaira <= 0 ||
      !categoryId ||
      !description.trim() ||
      !paymentMethod.trim()
    )
      return;
    setSaving(true);
    setError(null);
    try {
      await createFinanceExpense({
        amountKobo: String(Math.round(amountNaira * 100)),
        incurredAt,
        description: description.trim(),
        paymentMethod: paymentMethod.trim(),
        externalReference: externalReference.trim() || undefined,
        categoryId,
        sourceId: sourceId || undefined,
      });
      setAmountNaira("");
      setDescription("");
      setPaymentMethod("");
      setExternalReference("");
      setCategoryId(null);
      setSourceId(null);
      setExpenseOpened(false);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not record expense",
      );
    } finally {
      setSaving(false);
    }
  }

  async function askAndDeactivateSource(source: AcquisitionSourceRow) {
    const reason = globalThis.window.prompt(
      `Reason for deactivating ${source.name}:`,
    );
    if (!reason?.trim()) return;
    try {
      await deactivateAcquisitionSource(source.id, reason.trim());
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not deactivate source",
      );
    }
  }

  async function askAndDeactivateCategory(category: FinanceExpenseCategoryRow) {
    const reason = globalThis.window.prompt(
      `Reason for deactivating ${category.name}:`,
    );
    if (!reason?.trim()) return;
    try {
      await deactivateFinanceExpenseCategory(category.id, reason.trim());
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not deactivate category",
      );
    }
  }

  async function askAndVoidExpense(expense: FinanceExpenseRow) {
    const reason = globalThis.window.prompt(
      "Reason for voiding this expense record:",
    );
    if (!reason?.trim()) return;
    try {
      await voidFinanceExpense(expense.id, reason.trim());
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not void expense",
      );
    }
  }

  const activeCategories = categories.filter((category) => category.isActive);
  const activeSources = sources.filter((source) => source.isActive);

  return (
    <Stack mt="xl" gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={3}>Finance Reports</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Platform Revenue ledger activity and externally paid expenses for
            the selected dates.
          </Text>
        </div>
        {canManage && (
          <Group>
            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              onClick={() => setSourceOpened(true)}
            >
              Campaign source
            </Button>
            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              onClick={() => setCategoryOpened(true)}
            >
              Expense category
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setExpenseOpened(true)}
            >
              Record expense
            </Button>
          </Group>
        )}
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      <Paper withBorder p="md" radius="md">
        <Group align="flex-end">
          <TextInput
            type="date"
            label="From (WAT)"
            value={dateWindow.startDate}
            onChange={(event) =>
              setDateWindow((current) => ({
                ...current,
                startDate: event.currentTarget.value,
              }))
            }
          />
          <TextInput
            type="date"
            label="To (WAT)"
            value={dateWindow.endDate}
            onChange={(event) =>
              setDateWindow((current) => ({
                ...current,
                endDate: event.currentTarget.value,
              }))
            }
          />
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => void load()}
            loading={loading}
          >
            Refresh
          </Button>
          {report && (
            <Text size="xs" c="dimmed">
              Report as of{" "}
              {new Date(report.asOf).toLocaleString("en-NG", {
                timeZone: "Africa/Lagos",
              })}{" "}
              WAT
            </Text>
          )}
        </Group>
      </Paper>

      {loading && !report ? (
        <Stack>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} h={74} radius="md" />
          ))}
        </Stack>
      ) : (
        report && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Platform Revenue credits"
                value={fmtKobo(report.platformRevenueCreditsKobo)}
              />
              <SummaryCard
                title="Platform Revenue debits"
                value={fmtKobo(report.platformRevenueDebitsKobo)}
              />
              <SummaryCard
                title="Net Platform Revenue"
                value={fmtKobo(report.platformRevenueNetKobo)}
              />
              <SummaryCard
                title="Reported expenses"
                value={fmtKobo(report.reportedExpensesKobo)}
                detail="Paid outside platform wallets"
              />
              <SummaryCard
                title="Operating result"
                value={fmtKobo(report.operatingResultKobo)}
                detail="Net revenue less recorded expenses"
              />
            </div>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" mb="sm">
                <div>
                  <Title order={5}>Customer acquisition cost</Title>
                  <Text size="xs" c="dimmed">
                    Actual source spend ÷ attributed registrations created in
                    this window.
                  </Text>
                </div>
                <Text size="xs" c="dimmed">
                  Unattributed: {report.unattributedRegistrations} registered,{" "}
                  {report.unattributedVerifiedRegistrations} verified
                </Text>
              </Group>
              <Table.ScrollContainer minWidth={900}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Campaign / source</Table.Th>
                      <Table.Th>Spend</Table.Th>
                      <Table.Th>Registrations</Table.Th>
                      <Table.Th>Registration CAC</Table.Th>
                      <Table.Th>KYC approved</Table.Th>
                      <Table.Th>Verified CAC</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {report.campaigns.map((campaign) => (
                      <Table.Tr key={campaign.sourceId}>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            {campaign.sourceName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {campaign.trackingCode ?? "Archived source"}
                          </Text>
                        </Table.Td>
                        <Table.Td>{fmtKobo(campaign.spendKobo)}</Table.Td>
                        <Table.Td>{campaign.registrations}</Table.Td>
                        <Table.Td>
                          {fmtKobo(campaign.registrationCacKobo)}
                        </Table.Td>
                        <Table.Td>{campaign.verifiedRegistrations}</Table.Td>
                        <Table.Td>{fmtKobo(campaign.verifiedCacKobo)}</Table.Td>
                      </Table.Tr>
                    ))}
                    {report.campaigns.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text size="sm" c="dimmed" ta="center">
                            No tracked campaign sources for this window.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="sm">
                Expenses by category
              </Title>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Amount</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {report.expensesByCategory.map((row) => (
                    <Table.Tr key={row.categoryId}>
                      <Table.Td>{row.categoryName}</Table.Td>
                      <Table.Td>{fmtKobo(row.amountKobo)}</Table.Td>
                    </Table.Tr>
                  ))}
                  {report.expensesByCategory.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={2}>
                        <Text size="sm" c="dimmed" ta="center">
                          No expenses in this date window.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="sm">
                Expense records{" "}
                <Text span size="xs" c="dimmed">
                  (latest 100)
                </Text>
              </Title>
              <Table.ScrollContainer minWidth={900}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Paid by</Table.Th>
                      <Table.Th>Campaign</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                      {canManage && <Table.Th />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {expenses.map((expense) => (
                      <Table.Tr key={expense.id}>
                        <Table.Td>{fmtDate(expense.incurredAt)}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{expense.description}</Text>
                          {expense.externalReference && (
                            <Text size="xs" c="dimmed">
                              {expense.externalReference}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>{expense.category.name}</Table.Td>
                        <Table.Td>{expense.paymentMethod}</Table.Td>
                        <Table.Td>{expense.source?.name ?? "—"}</Table.Td>
                        <Table.Td>{fmtKobo(expense.amountKobo)}</Table.Td>
                        <Table.Td>
                          {expense.voidedAt ? (
                            <Badge color="gray">Voided</Badge>
                          ) : (
                            <Badge color="green">Recorded</Badge>
                          )}
                        </Table.Td>
                        {canManage && (
                          <Table.Td>
                            {!expense.voidedAt && (
                              <Button
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => void askAndVoidExpense(expense)}
                              >
                                Void
                              </Button>
                            )}
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                    {expenses.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={canManage ? 8 : 7}>
                          <Text size="sm" c="dimmed" ta="center">
                            No expense records in this window.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>

            {canManage && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Paper withBorder p="md" radius="md">
                  <Title order={5} mb="sm">
                    Campaign sources
                  </Title>
                  <Stack gap="xs">
                    {sources.map((source) => (
                      <Group key={source.id} justify="space-between">
                        <div>
                          <Text size="sm" fw={600}>
                            {source.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {source.trackingCode}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Badge color={source.isActive ? "green" : "gray"}>
                            {source.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {source.isActive && (
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                void askAndDeactivateSource(source)
                              }
                            >
                              Deactivate
                            </Button>
                          )}
                        </Group>
                      </Group>
                    ))}
                    {sources.length === 0 && (
                      <Text size="sm" c="dimmed">
                        No sources configured.
                      </Text>
                    )}
                  </Stack>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Title order={5} mb="sm">
                    Expense categories
                  </Title>
                  <Stack gap="xs">
                    {categories.map((category) => (
                      <Group key={category.id} justify="space-between">
                        <Text size="sm">{category.name}</Text>
                        <Group gap="xs">
                          <Badge color={category.isActive ? "green" : "gray"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {category.isActive && (
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                void askAndDeactivateCategory(category)
                              }
                            >
                              Deactivate
                            </Button>
                          )}
                        </Group>
                      </Group>
                    ))}
                    {categories.length === 0 && (
                      <Text size="sm" c="dimmed">
                        No categories configured.
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </div>
            )}
          </>
        )
      )}

      <Modal
        opened={sourceOpened}
        onClose={() => setSourceOpened(false)}
        title="Add campaign source"
        centered
      >
        <Stack>
          <TextInput
            label="Source name"
            value={sourceName}
            onChange={(event) => setSourceName(event.currentTarget.value)}
            maxLength={100}
          />
          <TextInput
            label="Tracking code"
            description="Share this code as ?source=CODE on the signup link."
            value={trackingCode}
            onChange={(event) =>
              setTrackingCode(event.currentTarget.value.toUpperCase())
            }
            maxLength={40}
          />
          <Button
            onClick={() => void saveSource()}
            loading={saving}
            disabled={!sourceName.trim() || trackingCode.trim().length < 3}
          >
            Save source
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={categoryOpened}
        onClose={() => setCategoryOpened(false)}
        title="Add expense category"
        centered
      >
        <Stack>
          <TextInput
            label="Category name"
            value={categoryName}
            onChange={(event) => setCategoryName(event.currentTarget.value)}
            maxLength={80}
          />
          <Button
            onClick={() => void saveCategory()}
            loading={saving}
            disabled={!categoryName.trim()}
          >
            Save category
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={expenseOpened}
        onClose={() => setExpenseOpened(false)}
        title="Record an externally paid expense"
        centered
      >
        <Stack>
          <Alert color="blue" variant="light">
            This records an expense already paid outside Ajoti platform wallets.
            It does not debit PLATFORM_REVENUE.
          </Alert>
          <NumberInput
            label="Amount (NGN)"
            min={0.01}
            decimalScale={2}
            value={amountNaira}
            onChange={(value) =>
              setAmountNaira(typeof value === "number" ? value : "")
            }
          />
          <TextInput
            type="date"
            label="Incurred date (WAT)"
            value={incurredAt}
            onChange={(event) => setIncurredAt(event.currentTarget.value)}
          />
          <TextInput
            label="Payment method"
            placeholder="Company Card"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.currentTarget.value)}
            maxLength={100}
          />
          <Select
            label="Expense category"
            data={activeCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            value={categoryId}
            onChange={setCategoryId}
            searchable
          />
          <Select
            label="Campaign source (optional)"
            data={activeSources.map((source) => ({
              value: source.id,
              label: `${source.name} (${source.trackingCode})`,
            }))}
            value={sourceId}
            onChange={setSourceId}
            clearable
            searchable
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            maxLength={500}
            autosize
            minRows={2}
          />
          <TextInput
            label="External reference (optional)"
            value={externalReference}
            onChange={(event) =>
              setExternalReference(event.currentTarget.value)
            }
            maxLength={120}
          />
          <Button
            onClick={() => void saveExpense()}
            loading={saving}
            disabled={
              !amountNaira ||
              amountNaira <= 0 ||
              !categoryId ||
              !description.trim() ||
              !paymentMethod.trim()
            }
          >
            Save expense
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default FinanceReports;
