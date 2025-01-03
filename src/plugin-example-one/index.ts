// You can do a named export
export const getName = (first: string, last: string) => `${first} ${last}`

// Or a default export
export default function getFullName(first: string, last: string) {
  return `${first} ${last}`
}
