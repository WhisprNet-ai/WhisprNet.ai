/**
 * Generates a random secure password
 * @param {number} length - Length of the password to generate (default: 12)
 * @param {boolean} includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} includeNumbers - Include numbers (default: true)
 * @param {boolean} includeSymbols - Include symbols (default: true)
 * @returns {string} - Generated password
 */
export const generatePassword = (
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSymbols = true
) => {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O which can be confused with 1 and 0
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Excluding l which can be confused with 1
  const numberChars = '23456789'; // Excluding 0 and 1 which can be confused with O and l
  const symbolChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Combine all allowed character sets
  let allowedChars = '';
  if (includeUppercase) allowedChars += uppercaseChars;
  if (includeLowercase) allowedChars += lowercaseChars;
  if (includeNumbers) allowedChars += numberChars;
  if (includeSymbols) allowedChars += symbolChars;

  // If no character sets are selected, default to lowercase + numbers
  if (allowedChars === '') {
    allowedChars = lowercaseChars + numberChars;
  }

  // Generate password
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    password += allowedChars[randomIndex];
  }

  // Ensure at least one character from each included set is present
  const requiredChars = [];
  if (includeUppercase) {
    const randomUppercase = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    requiredChars.push(randomUppercase);
  }
  if (includeLowercase) {
    const randomLowercase = lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    requiredChars.push(randomLowercase);
  }
  if (includeNumbers) {
    const randomNumber = numberChars[Math.floor(Math.random() * numberChars.length)];
    requiredChars.push(randomNumber);
  }
  if (includeSymbols) {
    const randomSymbol = symbolChars[Math.floor(Math.random() * symbolChars.length)];
    requiredChars.push(randomSymbol);
  }

  // Replace first few characters with required ones to ensure we have at least one of each type
  for (let i = 0; i < requiredChars.length; i++) {
    password = password.substring(0, i) + requiredChars[i] + password.substring(i + 1);
  }

  return password;
};

export default {
  generatePassword
}; 