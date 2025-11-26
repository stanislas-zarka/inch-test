export const splitRowsRespectingQuotes = (text: string): string[] => {
  const rows: string[] = [];
  let line: string = "";
  let inQuotes: boolean = false;

  for (const character of text) {
    switch (character) {
      case '"':
        inQuotes = !inQuotes;
        line += character;
        break;

      case "\n":
      case "\r":
        if (inQuotes) {
          // newline inside quotes → keep it
          line += character;
        } else {
          // newline outside quotes → end of row
          if (line) rows.push(line);
          line = "";
        }
        break;

      default:
        line += character;
    }
  }

  if (line) rows.push(line);
  return rows;
};

export const dateRegex: RegExp = /^\d{2}\/\d{2}\/\d{4}/;

export const splitFields = (row: string): string[] => {
  const fields: string[] = [];
  let current: string = "";
  let inQuotes: boolean = false;

  for (const character of row) {
    switch (character) {
      case '"':
        // Toggle inQuotes state when encountering a quote
        inQuotes = !inQuotes;
        break;
      case ",":
        // If not inside quotes, treat comma as a field separator
        if (!inQuotes) {
          fields.push(current); // save the current field
          current = ""; // reset for the next field
          break;
        }
        // If inside quotes, keep the comma as part of the field
        current += character;
        break;
      default:
        // Add any other character to the current field
        current += character;
    }
  }

  // Add the last field after finishing the loop
  fields.push(current);

  // Trim whitespace from all fields before returning
  return fields.map((f) => f.trim());
};

export const isAccountCode = (str?: string) =>
  !!str && /^[0-9]{3,}/.test(str.trim());

export const parseNumber = (str?: string) =>
  str
    ? Number(
        str
          .replace(/\u00A0/g, "")
          .replace(/ /g, "")
          .replace(",", ".")
      ) || 0
    : 0;

export const parseDate = (s?: string) =>
  s ? new Date(s.split("/").reverse().join("-")) : new Date(0);

export const round2 = (num: number) => Number(num.toFixed(2));
