
const { promisify } = require("util");
const sass = require("sass");
const sassRender = promisify(sass.render);
const fs = require("fs").promises;
const rollup = require("rollup");
const { PurgeCSS, default: purgecss } = require('purgecss')
const loadConfigFile = require('rollup/dist/loadConfigFile');
const minimatch = require("minimatch");
const path = require('path');

const defaultSassConfig = {
    file: './src/css/sass/index.scss',
    includePaths: ['./src/css'],
    sourceMap: false
};

const hydrateSassOptionSet = sassOptionSet => {
    sassOptionSet.config = { ...defaultSassConfig, ...sassOptionSet.config };

    // If we need to write source maps, and if we need to write multiple output paths...
    // ...then we need to create a unique sassOptionSet for each output path.
    if (sassOptionSet.config.sourceMap) {
        return sassOptionSet.output.map(outputPath => {
            sassOptionSet.output = [outputPath];
            sassOptionSet.config.outFile = outputPath;
            return sassOptionSet;
        });
    }

    return [sassOptionSet];
}

const buildSassFromConfig = sassOptionSet => {
    return sassRender(sassOptionSet.config)
        .then(async result => {
            let filesToWrite = sassOptionSet.output.flatMap(outputPath => {
                let filesForThisOutputPath = [];

                console.log(`[CaGov Build System] Writing ${outputPath} from ${sassOptionSet.config.file} (sass)`);
                filesForThisOutputPath.push(fs.writeFile(outputPath, result.css));

                if (sassOptionSet.config.sourceMap) {
                    let sourceMapOutputPath = outputPath.replace(/\.css/gi, ".map.css");
                    console.log(`[CaGov Build System] Writing ${sourceMapOutputPath} from ${outputPath} (sass)`);
                    filesForThisOutputPath.push(fs.writeFile(sourceMapOutputPath, result.map));
                }

                return filesForThisOutputPath;
            });

            await Promise.all(filesToWrite);
            return sassOptionSet.output;
        });
};

const defaultPurgeConfig = {
    safelist: [/lang$/, /dir$/],
    extractors: [
        {
            extractor: content => content.match(/[A-Za-z0-9-_:\/]+/g) || [],
            extensions: ['js']
        }
    ]
};

const hydratePurgeOptionSets = (sourceFile, purgeOptionSets) => {
    return purgeOptionSets.map(purgeOptionSet => {
        purgeOptionSet.config = { ...defaultPurgeConfig, ...purgeOptionSet.config };
        purgeOptionSet.config.css = [sourceFile];
        return purgeOptionSet;
    });
};

const purgeCssFromConfig = purgeOptionSet => {
    return new PurgeCSS().purge(purgeOptionSet.config)
        .then(async result => {
            let filesToWrite = purgeOptionSet.output.map(outputPath => {
                console.log(`[CaGov Build System] Writing ${outputPath} from ${purgeOptionSet.config.css} (purgecss)`);
                return fs.writeFile(outputPath, result[0].css);
            });

            await Promise.all(filesToWrite);
            return purgeOptionSet.output;
        });
};

const generateSass = async sassOptions => {
    let sassOptionSets = sassOptions.flatMap(sassOptionSet => hydrateSassOptionSet(sassOptionSet));

    let sassActions = sassOptionSets.map(sassOptionSet => {
        let sassAction = buildSassFromConfig(sassOptionSet);

        if (sassOptionSet.hasOwnProperty('purge')) {
            sassAction.then(async outputPaths => {
                let purgeOptionSets = hydratePurgeOptionSets(outputPaths[0], sassOptionSet.purge);
                let purgeActions = purgeOptionSets.map(purgeOptionSet => purgeCssFromConfig(purgeOptionSet));
                await Promise.all(purgeActions);
            })
        }

        sassAction.catch(err => console.log(err));
    });

    await Promise.all(sassActions);
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

        await Promise.all([generateSass(options.sass), generateRollup(options.rollup)]);
    });
    
    
    eleventyConfig.on('beforeWatch', async changedFiles => {
        let cssChanged = changedFiles.some(file => minimatch(file, options.sass[0].watch[0]));
        let jsChanged = changedFiles.some(file => minimatch(file, options.rollup[0].watch[0]));
        if (cssChanged) { generateSass(); }
        if (jsChanged) { await generateRollup(); }
    });
    
}