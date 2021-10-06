const postcssSass = require('@csstools/postcss-sass');

module.exports = {
    to: 'docs/css/build/development.css',
    from: 'src/css/_index.scss',
    plugins: [
        postcssSass({ includePaths: [ '.src/css' ] })
    ]
};