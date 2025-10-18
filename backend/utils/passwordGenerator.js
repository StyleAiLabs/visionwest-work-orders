const crypto = require('crypto');

/**
 * Generates a secure random password with mixed character types
 * @returns {string} 12-character password with uppercase, lowercase, numbers, and symbols
 */
function generateSecurePassword() {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each character type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  password += symbols[crypto.randomInt(0, symbols.length)]; // 2 symbols minimum

  // Fill remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
}

module.exports = { generateSecurePassword };
