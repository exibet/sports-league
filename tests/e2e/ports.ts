// Fixed ports for the e2e servers, different from `dev:fixtures` (3000 / 3901), so a running dev
// session does not clash.
export const APP_PORT = 3920
export const FIXTURE_PORT = 3921
export const FIXTURE_ORIGIN = `http://localhost:${FIXTURE_PORT}`
