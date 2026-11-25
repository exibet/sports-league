import { createError } from 'h3'
import { UpstreamError, type UpstreamErrorCode } from './sportsdb/errors'

// Shown to the user; never the key, the upstream URL or the endpoint.
const MESSAGES: Record<UpstreamErrorCode, string> = {
  'rate-limited': 'TheSportsDB is limiting requests right now. Try again in a minute.',
  'timeout': 'TheSportsDB did not answer in time. Try again.',
  'unreachable': 'TheSportsDB could not be reached. Try again.',
  'bad-status': 'TheSportsDB answered with an error. Try again later.',
  'invalid-response': 'TheSportsDB sent an unexpected response. Try again later.',
}

/**
 * What a route throws for an error it caught. An upstream failure becomes a 502 with a readable
 * message and the failure kind in `data.reason`. Anything else passes through unchanged: HTTP
 * errors (400/404) keep their status, and a bug in our own code stays a 500 that Nitro logs and
 * answers with a generic "Server Error", instead of being disguised as an upstream problem.
 */
export function mapUpstreamError(error: unknown): unknown {
  if (!(error instanceof UpstreamError)) {
    return error
  }
  return createError({
    statusCode: 502,
    statusMessage: 'Bad Gateway',
    message: MESSAGES[error.code],
    data: { reason: error.code },
  })
}
