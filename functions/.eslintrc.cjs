module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    "ecmaVersion": "latest",
    "sourceType": "module",
    babelOptions: {
      presets: ['@babel/preset-env'] // Nếu bạn dùng Babel presets (tùy chọn)
    }
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "comma-dangle": "off", 
    "max-len": "off", 
    "object-curly-spacing": "off", 
    "no-trailing-spaces": "off", 
    "indent": "off",
    "require-jsdoc": "off", 
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
