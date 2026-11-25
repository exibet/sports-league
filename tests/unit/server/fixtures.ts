import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const UPSTREAM = new URL('../../fixtures/upstream/', import.meta.url)

/** A file from `tests/fixtures/upstream/`, as the upstream sends it. */
export function readFixture(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, UPSTREAM)), 'utf8')
}

/** A JSON fixture, parsed: `unknown`, like any upstream payload. */
export function readJsonFixture(path: string): unknown {
  return JSON.parse(readFixture(path))
}
