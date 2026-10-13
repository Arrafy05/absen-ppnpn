import { Employee } from '../types';

/**
 * Verifies an employee's PIN.
 * - If employee has a custom PIN set (employee.pin), matches against that.
 * - If not set yet, accepts:
 *   1. Their Fingerprint ID (e.g. "4", "241", "604")
 *   2. Zero-padded Fingerprint ID (e.g. "0004", "0241")
 *   3. Global default PIN "1234"
 */
export function verifyEmployeePin(employee: Employee, inputPin: string): boolean {
  const cleanInput = inputPin.trim();
  if (!cleanInput) return false;

  if (employee.pin && employee.pin.trim().length > 0) {
    return employee.pin.trim() === cleanInput;
  }

  // Default fallback PINs for first-time login
  const fpStr = String(employee.fingerprint_id).trim();
  const fpPadded = fpStr.padStart(4, '0');
  
  return cleanInput === fpStr || cleanInput === fpPadded || cleanInput === '1234';
}

/**
 * Returns a human-friendly hint for initial login PIN.
 */
export function getDefaultPinHint(employee: Employee): string {
  if (employee.pin) {
    return 'PIN khusus pribadi sudah aktif. Gunakan PIN yang telah Anda tentukan.';
  }
  return `PIN Awal: Gunakan PIN Mesin Sidik Jari Anda (${employee.fingerprint_id}) atau 1234.`;
}

/**
 * Checks if the employee has personalized their PIN.
 */
export function isCustomPinSet(employee: Employee): boolean {
  return Boolean(employee.pin && employee.pin.trim().length > 0);
}
