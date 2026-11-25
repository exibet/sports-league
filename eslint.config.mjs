// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'no-console': 'error',
      // Strict mode only rejects implicit `any`; this rejects the explicit one.
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/max-len': ['error', { code: 120, ignoreUrls: true }],
    },
  },
  {
    // Command-line tools print to the terminal.
    files: ['scripts/**', 'tests/fixtures/**'],
    rules: {
      'no-console': 'off',
    },
  },
)
