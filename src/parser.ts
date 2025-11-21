import { TParsingResult } from "./types";

export const parse = async (inputCSVFile: string): Promise<TParsingResult> => {
  return {
    records: [],
    accounts: [],
    balance: {
      totalDebit: 0,
      totalCredit: 0,
    },
  };
};
