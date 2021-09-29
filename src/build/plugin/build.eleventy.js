const sass = require("sass");
const fs = require("fs");
const rollup = require("rollup");
const { PurgeCSS, default: purgecss } = require('purgecss')
const loadConfigFile = require('rollup/dist/loadConfigFile');
const minimatch = require("minimatch");
const path = require('path');

const generateSass = (options) => {
    let defaultSassConfig = {
        file: './src/css/sass/index.scss',
        includePaths: ['./src/css'],
        sourceMap: false
    };

    let sassOptionsMap = options.map(sassOptions => {
        sassOptions.sassConfig = { ...defaultSassConfig, ...sassOptions.sassConfig };
        return sassOptions;
    });

    sassOptionsMap.forEach(sassOptions => {
        sassOptions.output.forEach(output => {
            sassOptions.sassConfig.outFile = output;
            sass.render(sassOptions.sassConfig, (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(`[CaGov Build System] Writing ${output} from ${sassOptions.sassConfig.file} (sass)`);
                fs.writeFileSync(output, result.css);
                if (sassOptions.sassConfig.sourceMap) {
                    fs.writeFileSync(output.replace(/\.css/gi, ".map.css"), result.map);
                }
            });
        });

        if (sassOptions.purge.length > 0) {
            sassOptions.purge.forEach(async purge => {
                const purgeCSSResult = await new PurgeCSS().purge({
                    content: purge.content,
                    css: [sassOptions.output[0]],
                    safelist: [/lang$/, /dir$/],
                    extractors: [
                        {
                            extractor: content => content.match(/[A-Za-z0-9-_:\/]+/g) || [],
                            extensions: ['js']
                        }
                    ]
                });
                console.log(`[CaGov Build System] Writing ${purge.output} from ${sassOptions.output[0]} (purgecss)`);
                fs.writeFileSync(purge.output, purgeCSSResult[0].css);
            });
        }
    }); 
};

const generateRollup = async options => {
    await Promise.all(options.map(rollupConfig => {
        // Lifted from https://rollupjs.org/guide/en/#programmatically-loading-a-config-file
        return loadConfigFile(path.resolve(process.cwd(), rollupConfig.file)).then(
            async ({ options, warnings }) => {
                warnings.flush();
                for (const optionsObj of options) {
                    let bundle = await rollup.rollup(optionsObj);
                    await Promise.all(optionsObj.output.map(output => {
                        console.log(`[CaGov Build System] Writing ${output.file} from ${rollupConfig.file} (rollup)`);
                        return bundle.write(output);
                    }));
                }
            }
        );
    }));
};

/**
 * 
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig
 */
module.exports = function(eleventyConfig, options = {}) {
    eleventyConfig.addWatchTarget(options.sass[0].watch[0]);
    eleventyConfig.addWatchTarget(options.rollup[0].watch[0]);

    eleventyConfig.on('beforeBuild', async function() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Note: Building site in dev mode. Try *npm run start* if you need a full build.');
        }

        if (typeof options.beforeBuild === Function) {
            options.beforeBuild();
        }

        generateSass(options.sass);
        await generateRollup(options.rollup);
    });
    
    
    eleventyConfig.on('beforeWatch', async changedFiles => {
        let cssChanged = changedFiles.some(file => minimatch(file, options.sass[0].watch[0]));
        let jsChanged = changedFiles.some(file => minimatch(file, options.rollup[0].watch[0]));
        if (cssChanged) { generateSass(); }
        if (jsChanged) { await generateRollup(); }
    });
    
}