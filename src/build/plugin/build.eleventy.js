const fs = require("fs").promises;
const rollup = require("rollup");
const loadConfigFile = require('rollup/dist/loadConfigFile');
const minimatch = require("minimatch");
const path = require('path');
const postcss = require('postcss');

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

/**
 * 
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig
 */
module.exports = function(eleventyConfig, options = {}) {

    for (watch in [...options.postcss.map(s => s.watch), ...options.rollup.map(r => r.watch)]) {
        eleventyConfig.addWatchTarget(watch);
    }

    eleventyConfig.on('beforeBuild', async function() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Note: Building site in dev mode. Try *npm run start* if you need a full build.');
        }

        if (typeof options.beforeBuild === Function) {
            options.beforeBuild();
        }

        await Promise.all([
            generatePostCss(options.postcss),
            generateRollup(options.rollup)
        ]);
    });
    
    
    eleventyConfig.on('beforeWatch', async changedFiles => {
        let cssChanged = changedFiles.some(file => minimatch(file, options.postcss[0].watch[0]));
        let jsChanged = changedFiles.some(file => minimatch(file, options.rollup[0].watch[0]));
        if (cssChanged) { generateSass(); }
        if (jsChanged) { await generateRollup(); }
    });
    
}