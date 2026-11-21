// Caller identity and this result must come from authenticated server context, never client input.
export function requireIssuerRole(result: { data: unknown; error: unknown }): void {
  if (result.data !== true || result.error) throw new Error('Sua conta não está autorizada a emitir licenças.');
}