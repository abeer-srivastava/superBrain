/**
 * Generates a random alphanumeric string of specified length.
 * @param len - The length of the string to generate
 * @returns Alphanumeric string
 */
export function random(len: number): string {
  let options = "qwertyuiopasdfghjklzxcvbnm123456789";
  let optionSize = options.length;
  let ans = "";
  for (let i = 0; i < len; i++) {
    ans += options[Math.floor(Math.random() * optionSize)];
  }
  return ans;
}
