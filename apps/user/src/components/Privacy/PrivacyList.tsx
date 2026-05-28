import { Card, Stack } from "@mantine/core";
import { PrivacyItem } from "./PrivacyItem";

import ShieldIcon from "@/assets/Shield.svg";
import ArrowIcon from "@/assets/Arrow.svg";
import BigArrowIcon from "@/assets/BigArrow.svg";

export function PrivacyList() {
  return (
    <Card radius={12} withBorder padding="md">
      <Stack gap={12}>
        <PrivacyItem text="No Naira loss" iconSrc={ShieldIcon} />
        <PrivacyItem text="Accessible savings/investments"         iconSrc={ArrowIcon} />
        <PrivacyItem text="Competitive interest rates" iconSrc={BigArrowIcon} />
      </Stack>
    </Card>
  );
}
