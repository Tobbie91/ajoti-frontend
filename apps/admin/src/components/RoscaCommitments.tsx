import { useEffect, useState } from "react";
import { Badge, Button, Card, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import {
  getRoscaCommitments,
  type RoscaCommitments as Commitments,
} from "@/utils/api/member-wallet";
import { useWalletPrivacy } from "@/hooks/useWalletPrivacy";

function formatKobo(value: string): string {
  const amount = BigInt(value);
  const absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? "-" : ""}₦${(absolute / 100n).toLocaleString("en-NG")}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function RoscaCommitments({
  circleId,
  refreshVersion = 0,
}: {
  circleId?: string;
  refreshVersion?: number;
}) {
  const { hidden } = useWalletPrivacy();
  const [data, setData] = useState<Commitments | null>(null);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    getRoscaCommitments()
      .then((result) => {
        if (active) {
          setData(result);
          setError(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [circleId, refreshVersion, refresh]);

  const groupItems =
    data?.items.filter((item) => item.rosca?.circleId === circleId) ?? [];
  if (circleId && data && groupItems.length === 0) return null;
  const items = circleId
    ? groupItems
    : (data?.items.filter((item) => BigInt(item.reservedAmount) > 0n) ?? []);
  const amount = (kobo: string) => (hidden ? "••••••" : formatKobo(kobo));

  return (
    <Card
      withBorder
      radius="xl"
      className="border-[#DCEFE7] bg-white p-5 shadow-sm"
      component="section"
      aria-label={circleId ? "Group collateral" : "Ajo commitments"}
    >
      <div className="flex items-center justify-between gap-3">
        <Text fw={700} fz={18}>
          {circleId ? "Collateral reserved" : "Ajo commitments"}
        </Text>
        <Button
          variant="subtle"
          color="teal"
          size="xs"
          onClick={() => setRefresh((v) => v + 1)}
        >
          Refresh collateral
        </Button>
      </div>
      {error ? (
        <Text size="sm" c="red" role="status">
          Unable to load collateral. Please refresh.
        </Text>
      ) : !data ? (
        <Text size="sm" c="dimmed" role="status">
          Loading collateral…
        </Text>
      ) : (
        <>
          {!circleId && (
            <>
              <Text size="sm" c="dimmed" mt="sm">
                Currently reserved collateral
              </Text>
              <Text fw={700} fz={24}>
                {amount(data.totalReservedKobo)}
              </Text>
            </>
          )}
          <div className="mt-3 flex flex-col divide-y divide-[#EEF2F0]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  {!circleId &&
                    (item.rosca ? (
                      <Link
                        className="font-semibold text-[#0B6B55] hover:underline"
                        to={`/rosca/${item.rosca.circleId}`}
                      >
                        {item.rosca.circleName}
                      </Link>
                    ) : (
                      <Text fw={600}>Ajo reservation — group unavailable</Text>
                    ))}
                  {item.rosca && (
                    <Badge
                      variant="light"
                      color="teal"
                      ml={circleId ? 0 : "sm"}
                    >
                      {item.rosca.membershipStatus.toLowerCase()}
                    </Badge>
                  )}
                  {item.rosca && !circleId && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Contribution: {amount(item.rosca.contributionAmountKobo)}
                    </Text>
                  )}
                  {circleId &&
                    item.rosca &&
                    item.reservedAmount !==
                      item.rosca.originalCollateralKobo && (
                      <Text size="xs" c="dimmed" mt={4}>
                        Original collateral committed:{" "}
                        {amount(item.rosca.originalCollateralKobo)}
                      </Text>
                    )}
                </div>
                <div className="text-right">
                  {!circleId && (
                    <Text size="xs" c="dimmed">
                      Collateral reserved
                    </Text>
                  )}
                  <Text fw={700} fz={circleId ? 24 : 16}>
                    {amount(item.reservedAmount)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <Text size="sm" c="dimmed" mt="sm">
              No collateral is currently reserved for Ajo groups.
            </Text>
          )}
          <Text size="sm" c="dimmed" mt="sm">
            {circleId
              ? "This amount is reserved in your Ajoti wallet for this Ajo group. "
              : "This collateral stays in your Ajoti wallet. "}
            Reserved funds are unavailable to spend. This is not a platform fee;
            the group's release and forfeiture rules apply.
          </Text>
        </>
      )}
    </Card>
  );
}
