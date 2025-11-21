import { parse } from "./parser";
import { TBalance } from "./types";

const SAMPLE_1 = "./data/sample_1.csv";
const SAMPLE_3 = "./data/sample_3.csv";

const round2 = (num: number) => Math.round(num * 100) / 100;

describe("With sample 1", () => {
  describe("Basic validation", () => {
    test(`should return the right number of accounts`, async () => {
      const result = await parse(SAMPLE_1);
      expect(result.accounts.length).toBe(63);
    });

    test(`should return the right balance`, async () => {
      const result = await parse(SAMPLE_1);
      const expectedResult: TBalance = {
        totalDebit: 90667.3,
        totalCredit: 90667.3,
      };
      expect(result.accounts.length).toBe(expectedResult);
    });
  });

  describe("Detailed validations", () => {
    test(`Check accounts 401`, async () => {
      const result = await parse(SAMPLE_1);
      const accounts401 = result.accounts.filter((a) =>
        a.code.startsWith("401")
      );
      expect(accounts401.length).toBe(14);
    });

    test(`Check records for accounts 512`, async () => {
      const result = await parse(SAMPLE_1);
      const account512 = result.accounts.find((a) => a.code.startsWith("512"));
      const totals = account512?.recordItems.reduce(
        (acc, item) => {
          return {
            debit: round2(acc.debit + item.debit),
            credit: round2(acc.credit + item.credit),
          };
        },
        { debit: 0, credit: 0 }
      );
      expect(account512?.recordItems.length).toBe(40);

      expect(account512?.totalDebit).toBe(19604.06);
      expect(account512?.totalCredit).toBe(15712.89);

      expect(account512?.totalDebit).toBe(totals?.debit);
      expect(account512?.totalCredit).toBe(totals?.credit);
    });
  });
});

describe("With sample 3", () => {
  describe("Basic validation", () => {
    test(`should return the right number of accounts`, async () => {
      const result = await parse(SAMPLE_3);
      expect(result.accounts.length).toBe(67);
    });

    test(`should return the right balance`, async () => {
      const result = await parse(SAMPLE_3);
      const expectedResult: TBalance = {
        totalDebit: 152401.05,
        totalCredit: 152401.05,
      };
      expect(result.accounts.length).toBe(expectedResult);
    });
  });

  describe("Detailed validations", () => {
    test(`Check accounts 401`, async () => {
      const result = await parse(SAMPLE_3);
      const accounts401 = result.accounts.filter((a) =>
        a.code.startsWith("401")
      );
      expect(accounts401.length).toBe(20);
    });

    test(`Check records for accounts 512`, async () => {
      const result = await parse(SAMPLE_3);
      const account512 = result.accounts.find((a) => a.code.startsWith("512"));
      const totals = account512?.recordItems.reduce(
        (acc, item) => {
          return {
            debit: round2(acc.debit + item.debit),
            credit: round2(acc.credit + item.credit),
          };
        },
        { debit: 0, credit: 0 }
      );
      expect(account512?.recordItems.length).toBe(58);

      expect(account512?.totalDebit).toBe(60515.53);
      expect(account512?.totalCredit).toBe(18177.16);

      expect(account512?.totalDebit).toBe(totals?.debit);
      expect(account512?.totalCredit).toBe(totals?.credit);
    });
  });
});
