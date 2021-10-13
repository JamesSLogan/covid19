const postcssSass = require('@csstools/postcss-sass');
const purgecss = require('@fullhuman/postcss-purgecss');
const cssnano = require('cssnano');

module.exports = {
    to: 'pages/_buildoutput/built.css',
    from: 'src/css/_index.scss',
    plugins: [
        postcssSass({ 
            includePaths: [ '.src/css' ] 
        }),
        purgecss({
            content: [
                'pages/**/*.njk',
                'pages/**/*.html',
                'pages/**/*.js',
                'pages/wordpress-posts/banner*.html',
                'pages/@(translated|wordpress)-posts/new*.html'
            ],
            safelist: { deep: [/lang$/, /dir$/] },
            extractors: [
                {
                    extractor: content => content.match(/[A-Za-z0-9-_:\/]+/g) || [],
                    extensions: ['js']
                }
            ]
        }),
        cssnano
    ]
};