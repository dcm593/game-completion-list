// Thin wrapper over the Google Sheets v4 REST API.
//
// The spreadsheet is private, so an API key is not enough — it identifies the
// project but never says *who* is asking. We authenticate as a service
// account (a robot Google identity in your Cloud project) that the sheet has
// been shared with as a Viewer. Credentials are build-time only and never
// reach the bundle.

import { GoogleAuth } from "google-auth-library";

const SHEET_ID =
  process.env.SHEET_ID || "17MaGIl2oqhCbeAumRk0iJGNPJXCzTqdfIZpYbTqgx8M";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

// Everything the parser needs, and nothing else. Without a mask the response
// carries every format property of every cell and balloons to megabytes.
export const GRID_FIELDS = [
  "sheets.properties.title",
  "sheets.data.rowData.values(" +
    "formattedValue," +
    // An in-cell image arrives as an EMPTY userEnteredValue object. A truly
    // blank cell omits the key entirely, so this is what distinguishes the
    // trophy / co-op / replay icons from nothing at all.
    "userEnteredValue," +
    "effectiveFormat(backgroundColor,textFormat/foregroundColor)" +
    ")",
].join(",");

let cachedClient;

// Accepts either a path to the downloaded key file (GOOGLE_APPLICATION_
// CREDENTIALS) or the JSON blob pasted straight into .env
// (GOOGLE_SERVICE_ACCOUNT_KEY), whichever you find less annoying.
async function getClient() {
  if (cachedClient) return cachedClient;

  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!inline && !keyFile) {
    throw new Error(
      "No service account credentials. Set GOOGLE_APPLICATION_CREDENTIALS to " +
        "the key file path, or GOOGLE_SERVICE_ACCOUNT_KEY to the JSON itself, " +
        "in .env — then run via `npm run sync`."
    );
  }

  const auth = new GoogleAuth(
    inline
      ? { credentials: JSON.parse(inline), scopes: SCOPES }
      : { keyFile, scopes: SCOPES }
  );

  cachedClient = await auth.getClient();
  return cachedClient;
}

// `fields` of null asks for the full, unmasked response — used by the probe.
export async function getSpreadsheet({ ranges = [], fields = GRID_FIELDS } = {}) {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`
  );
  url.searchParams.set("includeGridData", "true");
  if (fields) url.searchParams.set("fields", fields);
  for (const range of ranges) url.searchParams.append("ranges", range);

  const client = await getClient();
  try {
    const res = await client.request({ url: url.toString() });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 403 || status === 404) {
      // Authentication worked; the sheet just hasn't been shared with us.
      const email = (await serviceAccountEmail()) ?? "the service account";
      throw new Error(
        `Sheets API ${status}: authenticated fine, but ${email} cannot see ` +
          "the sheet. Share it with that address as a Viewer."
      );
    }
    throw err;
  }
}

export async function serviceAccountEmail() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (inline) return JSON.parse(inline).client_email ?? null;
  const client = await getClient();
  return client.email ?? null;
}

// Rows come back ragged: trailing empty cells are omitted entirely, and an
// empty row can be `{}`. Normalize so the parser can index without guarding.
export function toGrid(sheet) {
  const rowData = sheet?.data?.[0]?.rowData ?? [];
  return rowData.map((row) => row.values ?? []);
}
