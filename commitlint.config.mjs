// Conventional Commits: `feat(leagues): …`, lowercase type, header ≤ 72, body lines ≤ 100.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
}
