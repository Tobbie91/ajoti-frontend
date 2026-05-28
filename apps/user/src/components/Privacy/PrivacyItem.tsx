import { Group, Text, Box } from "@mantine/core";

type Props = {
  text: string;
  /** SVG icon (imported as URL) */
  iconSrc?: string;
};

export function PrivacyItem({ text, iconSrc }: Props) {
  return (
    <Group gap={10}>
      {/* Privacy icon */}
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          width={16}
          height={16}
          style={{
            display: "block",
            objectFit: "contain",
          }}
        />
      ) : (
        <Box
          w={16}
          h={16}
          style={{
            borderRadius: 4,
            background: "#EEF2F1",
          }}
        />
      )}

      <Text fz={13}>{text}</Text>
    </Group>
  );
}
