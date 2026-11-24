/** Extract the shop code and always open it inside this app. */
export function shopCode(input: string): string | null {
  const value = input.trim().toLowerCase()
  let code = value
  if (/^https?:\/\//.test(value) || /^\/(?:s|shop)\//.test(value)) {
    try {
      const { pathname } = new URL(value, 'https://localhost')
      code = pathname.match(/^\/(?:s|shop)\/([^/]+)(?:\/(?:book|queue|barber\/[^/]+))?\/?$/)?.[1] ?? ''
    } catch {
      return null
    }
  }
  return /^[a-z0-9]([a-z0-9-]{1,58}[a-z0-9])?$/.test(code) ? code : null
}
