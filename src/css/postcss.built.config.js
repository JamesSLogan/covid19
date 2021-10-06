const postcssSass = require('@csstools/postcss-sass');
const cssnano = require('cssnano');

module.exports = {
    to: 'pages/_buildoutput/built.css',
    from: 'src/css/_index.scss',
    plugins: [
        postcssSass({ includePaths: [ '.src/css' ] }),
        cssnano()
    ]
};