/**
 * MoneyHelper
 *
 * A helper class for money-related operations such as converting rupees to paise,
 * converting paise back to rupees, and formatting monetary values.
 */
export class MoneyHelper {
  /**
   * Convert rupees to paise.
   * @param rupees - The amount in rupees.
   * @returns The equivalent amount in paise.
   */
  static rupeesToPaise(rupees: number): number {
    if (typeof rupees !== 'number') {
      throw new Error('Input must be a number');
    }
    // Multiply by 100 to convert rupees to paise
    return Math.round(rupees * 100);
  }

  /**
   * Convert paise to rupees.
   * @param paise - The amount in paise.
   * @returns The equivalent amount in rupees.
   */
  static paiseToRupees(paise: number): number {
    if (typeof paise !== 'number') {
      throw new Error('Input must be a number');
    }
    // Divide by 100 to convert paise to rupees
    return paise / 100;
  }

  /**
   * Format a rupees amount as a currency string.
   * @param rupees - The amount in rupees.
   * @param options - Optional formatting options.
   * @param options.locale - The locale to be used for formatting (default: 'en-IN').
   * @param options.currency - The currency code (default: 'INR').
   * @returns The formatted currency string.
   */
  static formatRupees(
    rupees: number,
    options?: { locale?: string; currency?: string }
  ): string {
    if (typeof rupees !== 'number') {
      try {
        rupees = parseFloat(rupees as any);
      } catch (error) {
        throw new Error('Input must be a number');
      }
    }
    const { locale = 'en-IN', currency = 'INR' } = options ?? {};
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(rupees);
  }

  /**
   * Format a paise amount as a currency string in rupees.
   * @param paise - The amount in paise.
   * @param options - Optional formatting options.
   * @param options.locale - The locale to be used for formatting (default: 'en-IN').
   * @param options.currency - The currency code (default: 'INR').
   * @returns The formatted currency string.
   */
  static formatPaise(
    paise: number,
    options?: { locale?: string; currency?: string }
  ): string {
    const rupees = MoneyHelper.paiseToRupees(paise);
    return MoneyHelper.formatRupees(rupees, options);
  }
}