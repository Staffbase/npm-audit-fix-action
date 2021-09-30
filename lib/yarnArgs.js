/**
 * @param {string[]} args
 */
export default function yarnArgs(...args) {
  return [...args, "--ignore-scripts", "--silent"];
}
