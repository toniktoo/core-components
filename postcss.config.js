/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
module.exports = {

  plugins: [
    require('postcss-import')({}),
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'nesting-rules': true,
        'color-mod-function': { unresolved: 'warn' },
      },
    }),
  ],
};
