import { downloadReportCsv, downloadReportPdf } from './report-export';
export { csvCell } from './report-export';
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

export function downloadUsersCsv(users: SuperadminUserRow[], filename: string) {
  downloadReportCsv([{ title: 'Users', columns, rows: userExportRows(users) }], filename);
}
export async function downloadUsersPdf(users: SuperadminUserRow[], filters: string, filename: string) {
  await downloadReportPdf([{ title: 'Users', columns, rows: userExportRows(users) }], 'Users report', filters, filename);
}
