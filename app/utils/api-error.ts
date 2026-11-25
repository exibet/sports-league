function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * The readable message of a failed `$fetch` to our `/api` (the server puts it in the JSON body's
 * `message`), or `fallback` when there is none (network failure, unexpected body).
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = isRecord(error) && isRecord(error.data) ? error.data.message : undefined
  return typeof message === 'string' && message ? message : fallback
}
