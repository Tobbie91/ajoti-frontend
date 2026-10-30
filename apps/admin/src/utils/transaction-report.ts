import type { WalletTransaction } from "./api";
import { formatKobo } from "./kobo";

/** Recent records only. Full-history exports continue through the existing emailed CSV job. */
export async function downloadTransactionPdf(
  transactions: WalletTransaction[],
) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const response = await fetch("/favicon.png");
  if (!response.ok)
    throw new Error("Unable to load the Ajoti logo. Please retry.");
  const logo = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = logo.width;
  canvas.height = logo.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare the report logo.");
  context.drawImage(logo, 0, 0);
  logo.close();
  const logoData = canvas.toDataURL("image/png"),
    doc = new jsPDF({ orientation: "landscape" });
  const rows = transactions.slice(0, 50);
  const date = (value: string) =>
    new Date(value).toLocaleString("en-GB", { timeZone: "Africa/Lagos" });
  const money = (value: unknown) =>
    value == null ? "—" : formatKobo(value).replace("₦", "");
  autoTable(doc, {
    head: [
      [
        "Date (WAT)",
        "Description",
        "Entry",
        "Movement",
        "Amount (NGN)",
        "Balance before (NGN)",
        "Balance after (NGN)",
        "Reference",
      ],
    ],
    body: rows.map((row) => [
      date(row.createdAt),
      row.description ?? row.movementType ?? row.entryType,
      row.entryType,
      row.movementType ?? "—",
      money(row.amount),
      money(row.balanceBefore),
      money(row.balanceAfter),
      row.id,
    ]),
    margin: { top: 55, bottom: 18, left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: [24, 54, 45],
    },
    headStyles: {
      fillColor: [11, 81, 64],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 247, 240] },
    didDrawPage: () => {
      doc.setFillColor(255, 250, 234);
      doc.rect(0, 0, 297, 25, "F");
      doc.addImage(logoData, "PNG", 14, 5, 15, 15);
      doc.setTextColor(11, 81, 64);
      doc.setFontSize(22);
      doc.text("ajoti", 33, 16);
      doc.setFontSize(15);
      doc.text("Recent transaction history", 14, 35);
      doc.setFontSize(8);
      doc.text(
        `Generated ${date(new Date().toISOString())} WAT | ${rows.length} recent records`,
        14,
        42,
      );
      doc.text(
        "Recent records only. Request the emailed CSV for your full transaction history.",
        14,
        48,
      );
      doc.setDrawColor(223, 231, 220);
      doc.line(14, 195, 283, 195);
      doc.text("Ajoti | Confidential - personal transaction history", 14, 201);
    },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`Page ${page} of ${pages}`, 283, 201, { align: "right" });
  }
  doc.save(
    `ajoti-recent-transactions-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
