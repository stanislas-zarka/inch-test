import { existsSync, readFileSync } from "fs";
import {
  dateRegex,
  parseNumber,
  parseDate,
  round2,
  isAccountCode,
  splitFields,
  splitRowsRespectingQuotes,
} from "./utils";
import { ParserState } from "./stateMachine";
import {
  TAccountWithRecordItems,
  TRecord,
  TRecordItemWithAccount,
  TRecordItem,
  TParsingResult,
} from "./types";

// Parser function: processes raw CSV-like file content or a path to a file
export async function parse(inputCSVFile: string): Promise<TParsingResult> {
  // Step 1 - Read the file
  let fileContent: string;
  try {
    if (existsSync(inputCSVFile)) {
      console.log(`Reading file: ${inputCSVFile}`);
      fileContent = readFileSync(inputCSVFile, "utf8");
    }
  } catch (e) {
    console.error(
      "Error reading file, assuming content was provided directly.",
      e
    );
    return Promise.reject(e);
  }

  // Step 1 - a - Initialize data structures
  const accountsMap = new Map<string, TAccountWithRecordItems>();
  const recordsForResult: TRecord[] = [];

  // Step 2 - Split into lines, respecting quotes
  console.log("Splitting file content into lines...");
  const lines: string[] = splitRowsRespectingQuotes(fileContent);

  // Step 3 - Parse lines using state machine
  console.log("Parsing lines...");
  let totalDebit: number;
  let totalCredit: number;

  // Step 3 - a - Initialize state
  let state: ParserState = ParserState.WAIT_ACCOUNT;
  let currentAccountCode: string | null = null;

  // Step 3 - b - Process each line
  lines.forEach((line) => {
    // Step 3 - b - 1 - Split line into fields
    const fields: string[] = splitFields(line);

    // Step 3 - b - 2 - Check for account header
    // If first field is an account code, it's an account header
    if (isAccountCode(fields[0])) {
      // Account header: set current account and label (if present)
      state = ParserState.IN_ACCOUNT;
      currentAccountCode = fields[0];
      // fields[1] is ignored
      const accountLabel: string = fields[2] || currentAccountCode;
      // Step 3 - b - 3 - Ensure account exists in the map
      let account: TAccountWithRecordItems =
        accountsMap.get(currentAccountCode);
      if (!account) {
        account = {
          code: currentAccountCode,
          label: accountLabel,
          totalDebit: 0,
          totalCredit: 0,
          recordItems: [],
        };
        accountsMap.set(currentAccountCode, account);
      } else {
        account.label = accountLabel;
      }
      return; // header line has no transaction
    }

    // Step 3 - b - 4 - Check for transaction line
    // If line starts with a date, it's a transaction for the current account
    if (
      dateRegex.test(fields[0]) &&
      state === ParserState.IN_ACCOUNT &&
      currentAccountCode
    ) {
      const date: Date = parseDate(fields[0]);
      // fields[1] is ignored
      const label: string = fields[2];
      const invoiceNumber: string = fields[3];
      const debit: number = parseNumber(fields[5]);
      const credit: number = parseNumber(fields[6]);

      // If both debit and credit are zero/empty, skip this transaction
      if (debit === 0 && credit === 0) {
        return;
      }

      // Step 3 - b - 5 - Ensure account exists in the map
      const accountCode = currentAccountCode as string;
      let account = accountsMap.get(accountCode) as
        | TAccountWithRecordItems
        | undefined;
      if (!account) {
        account = {
          code: accountCode,
          label: accountCode,
          totalDebit: 0,
          totalCredit: 0,
          recordItems: [],
        };
        accountsMap.set(accountCode, account);
      }

      // Step 3 - b - 6 - Create record item and add to account
      // We'll compute totals later using rounded accumulation
      const recordItem: TRecordItem = {
        date,
        label: label || `Record for ${accountCode}`,
        debit,
        credit,
        invoiceNumber: invoiceNumber || undefined,
      };
      account.recordItems.push(recordItem);

      // Step 3 - b - 7 - Also add to records for result
      recordsForResult.push({
        totalDebit: debit,
        totalCredit: credit,
        recordItems: [
          {
            ...recordItem,
            account: {
              code: account.code,
              label: account.label,
              totalDebit: account.totalDebit,
              totalCredit: account.totalCredit,
            },
          } as TRecordItemWithAccount,
        ],
      });

      return;
    }

    // Other lines we ignore (totals, page headers, etc.)
  });

  const accounts: TAccountWithRecordItems[] = Array.from(accountsMap.values());

  // Step 4 - Compute totals with proper rounding
  console.log("Computing totals with rounding...");
  // Recompute per-account totals using rounding after each addition (same as tests)
  let aggTotalDebit: number = 0;
  let aggTotalCredit: number = 0;
  accounts.forEach((account) => {
    let debit: number = 0;
    let credit: number = 0;
    account.recordItems.forEach((item) => {
      debit = round2(debit + item.debit);
      credit = round2(credit + item.credit);
    });
    account.totalDebit = debit;
    account.totalCredit = credit;
    aggTotalDebit = round2(aggTotalDebit + account.totalDebit);
    aggTotalCredit = round2(aggTotalCredit + account.totalCredit);
  });
  totalDebit = aggTotalDebit;
  totalCredit = aggTotalCredit;

  // Step 5 - Return final result
  console.log("Parsing complete.");
  return {
    accounts,
    balance: { totalDebit, totalCredit },
    records: recordsForResult,
  };
}
