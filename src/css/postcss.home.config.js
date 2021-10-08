const postcssSass = require('@csstools/postcss-sass');
const purgecss = require('@fullhuman/postcss-purgecss');
const cssnano = require('cssnano');

module.exports = {
    to: 'pages/_buildoutput/home.css',
    from: 'src/css/_index.scss',
    plugins: [
        postcssSass({ 
            includePaths: [ '.src/css' ] 
        }),
        purgecss({
            content: [
              'pages/_includes/main.njk',
              'pages/_includes/header.njk',
              'pages/_includes/footer.njk',
              'pages/_includes/accordion.html',
              'pages/**/*.js',
              'pages/wordpress-posts/banner*.html',
              'pages/wordpress-posts/homepage-featured.html',
              'pages/@(translated|wordpress)-posts/@(new|find-services|cali-working|home-header)*.html'
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