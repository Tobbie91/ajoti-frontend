import type { SuperadminUserRow } from "./api/users";

const columns = [
  "Name",
  "Email",
  "Phone",
  "Role",
  "KYC status",
  "Ajo groups",
  "Status",
  "Registered",
];
export function userExportRows(users: SuperadminUserRow[]) {
  return users.map((user) => [
    `${user.firstName} ${user.lastName}`,
    user.email,
    user.phone ?? "",
    user.role,
    user.kyc?.status ?? "NOT_SUBMITTED",
    String(user._count.roscaMemberships),
    user.status,
    new Date(user.createdAt).toLocaleDateString("en-GB", {
      timeZone: "Africa/Lagos",
    }),
  ]);
}

// Quote every cell and neutralise spreadsheet formulas in user-controlled fields.
export function csvCell(value: string) {
  const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadUsersCsv(users: SuperadminUserRow[], filename: string) {
  const csv =
    "\uFEFF" +
    [columns, ...userExportRows(users)]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadUsersPdf(
  users: SuperadminUserRow[],
  filters: string,
  filename: string,
) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const logoResponse = await fetch("/favicon.png");
  if (!logoResponse.ok)
    throw new Error("Unable to load the Ajoti logo. Please retry.");
  const logo = await createImageBitmap(await logoResponse.blob());
  const canvas = document.createElement("canvas");
  canvas.width = logo.width;
  canvas.height = logo.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare the report logo.");
  context.drawImage(logo, 0, 0);
  logo.close();
  const logoData = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "landscape" });
  const generated = new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
  });
  const summary = doc.splitTextToSize(filters, 265);
  autoTable(doc, {
    head: [columns],
    body: userExportRows(users),
    margin: { top: 53 + summary.length * 4, bottom: 18, left: 14, right: 14 },
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
    columnStyles: {
      0: { cellWidth: 37 },
      1: { cellWidth: 60 },
      2: { cellWidth: 33 },
    },
    didDrawPage: () => {
      doc.setFillColor(255, 250, 234);
      doc.rect(0, 0, 297, 25, "F");
      doc.addImage(logoData, "PNG", 14, 5, 15, 15);
      doc.setTextColor(11, 81, 64);
      doc.setFontSize(22);
      doc.text("ajoti", 33, 16);
      doc.setFontSize(15);
      doc.text("Users report", 14, 35);
      doc.setFontSize(8);
      doc.text(
        `${users.length.toLocaleString()} matching users | Generated ${generated} WAT`,
        14,
        42,
      );
      doc.text(summary, 14, 49);
      doc.setDrawColor(223, 231, 220);
      doc.line(14, 195, 283, 195);
      doc.setFontSize(8);
      doc.text("Ajoti | Confidential - staff use only", 14, 201);
    },
  });
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.text(`Page ${page} of ${count}`, 283, 201, { align: "right" });
  }
  doc.save(`${filename}.pdf`);
}
