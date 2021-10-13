const fs = require("fs").promises;
const rollup = require("rollup");
const loadConfigFile = require('rollup/dist/loadConfigFile');
const minimatch = require("minimatch");
const path = require('path');
const postcss = require('postcss');

const buildTypes = ['rollup', 'postcss'];

const allWatchGlobs = (options) =>
    buildTypes.flatMap(buildType => 
        options[buildType].flatMap(buildConfig => 
            buildConfig.watch
        )
    ).filter((value, index, collection) => 
        collection.indexOf(value) === index
    );

const generateRollup = rollupConfigs => {
    return Promise.all(rollupConfigs.map(rollupConfig => {
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

const generatePostCss = postcssConfigs => {
    return Promise.all(postcssConfigs.map(postcssConfig => {
        const { plugins, ...options } = require(path.resolve(process.cwd(), postcssConfig.file));

        return fs.readFile(options.from).then(css => 
            postcss(plugins).process(css, options).then(async result => {
                let filesToWrite = [];

                console.log(`[CaGov Build System] Writing ${options.to} from ${options.from} (postcss)`);
                filesToWrite.push(fs.writeFile(options.to, result.css, () => true));

                if ( result.map ) {
                    let sourceMapPath = options.to.replace(/\.css/gi, ".map.css");
                    console.log(`[CaGov Build System] Writing ${sourceMapPath} from ${options.to} (postcss)`);
                    filesToWrite.push(fs.writeFile(sourceMapPath, result.map.toString(), () => true));
                }

                await Promise.all(filesToWrite);
            })
        );
    }));
};

const includeCSSUnlessDev = (content, devFilePath) => {
    if (process.env.NODE_ENV === 'development') {
        return `<link rel="stylesheet" type="text/css" href="${devFilePath}">`;
    } else {
        return content;
    }
}

const includeJSUnlessDev = (content, devFilePath) => {
    if (process.env.NODE_ENV === 'development') {
        return `<script type="module" src="${devFilePath}"></script>`;
    } else {
        return content;
    }
}

const processChangedFilesFor = (configSet, changedFiles, callback) => {
    let configsWithChanges = configSet.filter(config => 
        changedFiles.some(file => 
            config.watch.some(watch => 
                minimatch(file.replace(/^\.\//, ''), watch)
            )
        )
    );

    if (configsWithChanges.length) {
        callback(configsWithChanges);
    }
}

let firstBuild = true;

/**
 * 
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig
 */
module.exports = (eleventyConfig, options = {}) => {
    eleventyConfig.addPairedShortcode("includecss", includeCSSUnlessDev);
    eleventyConfig.addPairedShortcode("includejs", includeJSUnlessDev);

    allWatchGlobs(options).forEach(watch => eleventyConfig.addWatchTarget(watch));

    eleventyConfig.on('beforeBuild', async function() {
        if (process.env.NODE_ENV === 'development') {
            console.log('[CaGov Build System] Note: Building site in dev mode.');
        }

        if (typeof options.beforeBuild === Function) {
            options.beforeBuild();
        }

        if ((process.env.NODE_ENV !== 'development') || firstBuild) {
            await Promise.all([
                generatePostCss(options.postcss),
                generateRollup(options.rollup)
            ]);

            firstBuild = false;
        }
    });
    
    eleventyConfig.on('beforeWatch', async changedFiles => {
        processChangedFilesFor(options.postcss, changedFiles, generatePostCss);
        processChangedFilesFor(options.rollup, changedFiles, generateRollup);
    });   
}