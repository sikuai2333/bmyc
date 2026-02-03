export const generateNumericPassword = () => {
  const digits = '0123456789';
  let password = '';
  for (let index = 0; index < 8; index += 1) {
    password += digits[Math.floor(Math.random() * digits.length)];
  }
  return password;
};
