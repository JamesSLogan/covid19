import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';

const defaultConfig = {
  equityChartsSampleDataLoc: 'https://files.covid19.ca.gov/data/chart-sandbox/',
  equityChartsVEDataLoc: 'https://files.covid19.ca.gov/data/vaccine-equity/',
  chartsVHPIDataLoc: 'https://files.covid19.ca.gov/data/vaccine-hpi/v2/',
}
const stagingConfig =  {
  equityChartsSampleDataLoc: 'https://raw.githubusercontent.com/cagov/covid-static/staging/data/chart-sandbox/',
  equityChartsVEDataLoc: 'https://raw.githubusercontent.com/cagov/covid-static/staging/data/vaccine-equity/',
  chartsVHPIDataLoc: 'https://raw.githubusercontent.com/cagov/covid-static/staging/data/vaccine-hpi/v2/',
}

const devOutputPath = 'docs/js/chartssandbox.js';
const prodOutputPath = 'pages/_buildoutput/chartssandbox.js';
const outputPath = (process.env.NODE_ENV === 'development') ? devOutputPath : prodOutputPath;
const jsConfig = (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV == "development") ? stagingConfig : defaultConfig;

export default {
  input: 'src/js/charts-sandbox/index.js',
  output: {
    intro: 'const config = '+JSON.stringify(jsConfig),
    file: outputPath,
    format: 'esm'
  },
  plugins: [
    resolve(), 
    postcss({
      extract: false,
      modules: false,
      use: ['sass'],
    }),
    // terser(),
    json()]
};
