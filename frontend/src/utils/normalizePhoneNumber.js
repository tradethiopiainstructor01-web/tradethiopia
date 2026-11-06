// Normalizes raw phone input (Excel cells, pasted text) into a clean dialable string.
// Ethiopian numbers are converted to the local 09.../07... format.
export const normalizePhoneNumber = (raw) => {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // Handle scientific notation e.g. 9.11223e+08
  if (/^[0-9.]+[eE][+-]?[0-9]+$/.test(str)) {
    try {
      const num = Number(str);
      if (!Number.isNaN(num)) {
        str = Math.round(num).toString();
      }
    } catch {
      // ignore
    }
  }

  // Remove .0 suffix often added by Excel numeric format
  str = str.replace(/\.0+$/, '');

  const hasPlus = str.startsWith('+');
  const digitsOnly = str.replace(/\D/g, '');

  if (digitsOnly.length < 7) return '';

  // Ethiopian 9 digits starting with 9 or 7 -> 09... / 07...
  if (digitsOnly.length === 9 && (digitsOnly.startsWith('9') || digitsOnly.startsWith('7'))) {
    return `0${digitsOnly}`;
  }

  // Ethiopian 12 digits starting with 2519 or 2517 -> 09... / 07...
  if (digitsOnly.length === 12 && (digitsOnly.startsWith('2519') || digitsOnly.startsWith('2517'))) {
    return `0${digitsOnly.slice(3)}`;
  }

  // 10 digits starting with 0
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return digitsOnly;
  }

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
};

export default normalizePhoneNumber;
