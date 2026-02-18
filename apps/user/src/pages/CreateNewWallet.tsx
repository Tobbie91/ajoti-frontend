import { useState } from "react";
import { Center, Group, Box, Text, Stack, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import Vector from "@/assets/Vector.svg";
import { CurrencyCard } from "@/components/CurrencyCard";
import { PrivacyList } from "@/components/Privacy/PrivacyList";

import NigerianFlag from "@/assets/NigerianFlag.svg";
import GreenCheck from "@/assets/GreenCheck.svg";


type Currency = "NGN";

// ---- manual knobs ----
const PAGE_MAX_W = 900;
const TOP_PADDING = 36;
const STACK_GAP = 14;

const ROW_MAX_W = 760;
const ROW_GAP = 18;
const CARD_W = 220;

const PRIVACY_MAX_W = 420;
const PRIVACY_OFFSET_LEFT = 100;
const PRIVACY_TOP_GAP = 18;

export function CreateNewWallet() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Currency>("NGN");

  return (
    <Box style={{ width: "100%", minHeight: "100vh", position: "relative" }}>

      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "179px",
          left: "367px",
          width: "84px",
          height: "30px",
          gap: "13px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <img
          src={Vector}
          alt=""
          aria-hidden="true"
          style={{ width: "16px", height: "16px" }}
        />
        <span
          style={{
            fontFamily: "Poppins, system-ui, sans-serif",
            fontSize: "20px",
            fontWeight: 300,
          }}
        >
          Back
        </span>
      </button>


      {/* ================= CENTERED CONTENT ================= */}
      <Center>
        <Box style={{ maxWidth: PAGE_MAX_W, width: "100%", paddingTop: 190 }}>
          <Stack gap={STACK_GAP} align="center">
            {/* Title */}
            <Text
              style={{
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: "100%",
                textAlign: "center",
                paddingBottom: 20,
              }}
            >
              Create New Wallet
            </Text>

            {/* Description */}
            <Text
              style={{
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 300,
                fontSize: 20,
                lineHeight: "100%",
                textAlign: "center",
                maxWidth: 420,
                paddingBottom:20,
              }}
            >
              Choose the currency to save in and beat inflation.
            </Text>

            {/* Currency card */}
            <Box style={{ maxWidth: ROW_MAX_W, width: "100%", marginTop: 10, paddingBottom:20 }}>
              <Group justify="center" gap={ROW_GAP}>
                <Box style={{ width: CARD_W }}>
                  <CurrencyCard
                    code="NGN"
                    symbol="₦"
                    amount="0.00"
                    active={selected === "NGN"}
                    onClick={() => setSelected("NGN")}
                    iconSrc={NigerianFlag}
                  />
                </Box>
              </Group>
            </Box>
          </Stack>
        </Box>
      </Center>

      {/* ================= PRIVACY + KYC ================= */}
      <Box
        style={{
          maxWidth: PAGE_MAX_W,
          margin: "0 auto",
          marginTop: PRIVACY_TOP_GAP,
          paddingLeft: PRIVACY_OFFSET_LEFT,
        }}
      >
        <Box style={{ width: "100%", maxWidth: PRIVACY_MAX_W }}>
          <PrivacyList />
        </Box>

        <Group gap={8} align="center" style={{ marginTop: 40 }}>
          <img
            src={GreenCheck}
            alt=""
            aria-hidden="true"
            style={{ width: 14, height: 14 }}
          />
          <Text
            style={{
              fontFamily: "Poppins, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 12,
              color: "rgba(0,0,0,0.55)",
            }}
          >
            KYC Verified
          </Text>
        </Group>
      </Box>

      {/* ================= FUND BUTTON (LAST) ================= */}
      <Center>
        <Button
          radius="xl"
          h={36}
          px={28}
          style={{
            marginTop: 60,
            background: "#9CB8B0",
            fontFamily: "Poppins, system-ui, sans-serif",
            fontWeight: 500,
          }}
          onClick={() => navigate("/fund-wallet")}
        >
          Fund Wallet
        </Button>
      </Center>
    </Box>
  );
}
