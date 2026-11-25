export type UpstreamErrorCode = 'rate-limited' | 'timeout' | 'unreachable' | 'bad-status' | 'invalid-response'

/**
 * Every upstream failure, detected before normalisation. The message is technical and names the
 * endpoint only: no API key, no URL, and no `cause` (the transport error's message contains the
 * URL). What the user reads is decided in `server/utils/http-errors.ts`.
 */
export class UpstreamError extends Error {
  override readonly name = 'UpstreamError'

  constructor(
    readonly code: UpstreamErrorCode,
    readonly endpoint: string,
    readonly status?: number,
  ) {
    super(`${code} (${endpoint}${status === undefined ? '' : `, HTTP ${status}`})`)
  }
}
