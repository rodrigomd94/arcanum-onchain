import numeral from 'numeral';

export const divideBigIntByNumberPrecise = (bigIntNumber: bigint, number: number) => {
  // Separate the number into its integer and fractional parts
  const integerPart = Math.trunc(number);
  const fractionalPart = number - integerPart;

  // Calculate the quotient and remainder when dividing the BigInt by the integer part
  const quotient = bigIntNumber / BigInt(integerPart);
  const remainder = bigIntNumber % BigInt(integerPart);

  // Calculate the fractional contribution by dividing the remainder by the integer part
  // and then dividing by the original number to account for the fractional part
  const fractionalContribution = Number(remainder) / (integerPart);

  // Combine the integer quotient with the fractional contribution
  const result = Number(quotient) + fractionalContribution;
  return result;
}

export function fNumber(number: string | number) {
  return numeral(number).format('0,0.[000]');
}

export function removeLeadingZeros(value: string | number): string {
  let val = value.toString().trim();

  // Check if the input is purely numeric or starts with a dot, indicating a decimal
  if (/^\d+\.?\d*$/g.test(val) || val === '0' || val.startsWith('.')) {
    // If the input starts with a zero followed by another number, remove the zero unless it's a decimal
    if (val.startsWith('0') && val.length > 1 && !val.startsWith('0.')) {
      val = val.substring(1);
    }
    return val;
  }

  // Special case: when the user starts typing a decimal with zero (e.g., '0.'), keep it
  if (val === '0.' || val.startsWith('0.0')) {
    return val;
  }

  // Handling leading zeros
  if (/^0+[1-9]/.test(val)) {
    val = val.replace(/^0+/, ''); // Remove all leading zeros if the number does not start with '0.'
  }

  return val;
}