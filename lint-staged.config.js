/** @type {import('lint-staged').Configuration} */
export default {
  "*.{ts,tsx,js}": ["eslint --fix --no-warn-ignored", "prettier --write"],
  "*.{json,md,yaml,yml,css}": "prettier --write",
};
