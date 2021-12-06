// variant chart
import template from "./variantchart-template.js";
import getTranslations from "../../../common/get-strings-list.js";
import getScreenResizeCharts from "../../../common/get-window-size.js";
import rtlOverride from "../../../common/rtl-override.js";
import chartConfig from './variantchart-config.json';
import renderChart from "./variantchart-render.js";
import { getSnowflakeStyleDate, reformatReadableDate } from "../../../common/readable-date.js";
import vchart_vdata from "./variantchart-data.json";
import formatValue from "./../../../common/value-formatters.js";
import applySubstitutions from "./../../../common/apply-substitutions.js";

// cagov-chart-dashboard-positivity-rate
class CAGovDashboardVariantChart extends window.HTMLElement {
  connectedCallback() {
    this.translationsObj = getTranslations(this);
    this.chartConfigFilter = this.dataset.chartConfigFilter;
    this.chartConfigKey = this.dataset.chartConfigKey;
    this.chartOptions = chartConfig[this.chartConfigKey][this.chartConfigFilter];

    console.log("Loading CAGovDashboardSparkline", this.chartConfigFilter, this.chartConfigKey);

    getScreenResizeCharts(this);

    this.screenDisplayType = window.charts
      ? window.charts.displayType
      : "desktop";

    this.chartBreakpointValues = chartConfig[this.screenDisplayType];
    this.dimensions = this.chartBreakpointValues;

    const handleChartResize = () => {
      getScreenResizeCharts(this);
      this.screenDisplayType = window.charts
        ? window.charts.displayType
        : "desktop";
      this.chartBreakpointValues = chartConfig[
        this.screenDisplayType ? this.screenDisplayType : "desktop"
      ];
    };

    window.addEventListener("resize", handleChartResize);


    // Set default values for data and labels
    // console.log("Reading data file",this.chartOptions.dataPathVar, config);

    this.dataUrl = config[this.chartOptions.dataPathVar] + this.chartOptions.dataUrl;
    // console.log("Loading sparkline json",this.dataset.chartConfigKey,this.dataUrl);
    this.retrieveData(this.dataUrl);

    rtlOverride(this); // quick fix for arabic

  }

  ariaLabel(d, baselineData) {
    let caption = ''; // !!!
    return caption;
  }

  getLegendText() {
    return [];
  }

  // Unused callback, just in case
  renderExtras(svg, data, x, y) {
  }

  getTooltipContent(di) {    
    const repDict = {
       WEEKDATE:   reformatReadableDate(this.line_series_array[0][di].DATE),
    }
    this.chartlabels.forEach(  (lab, i) => {
      repDict['LABEL_'+i] = lab;
      repDict['VALUE_'+i] = formatValue(this.line_series_array[i][di].VALUE/100.0,{format:'percent'});
    });
    let caption = applySubstitutions(this.translationsObj.tooltipContent, repDict);
    return caption;
  }


  renderComponent() {
    this.innerHTML = template.call(this, this.chartOptions, this.translationsObj);

    let line_series_array = [];

    this.chartlabels.forEach((label, i) => {
        let tseries_name = label + "_Percentage-Average";
        line_series_array.push(this.chartdata.time_series[tseries_name].VALUES);
    });
    this.line_series_array = line_series_array;

    console.log("Rendering variants chart",this.translationsObj, this.line_series_array);

    let renderOptions = {
                          'chart_style':this.chartOptions.chart_style,
                          'extras_func':this.renderExtras,
                          'line_series_array':line_series_array,
                          'x_axis_field':this.chartOptions.x_axis_field,
                          'y_axis_legend':this.translationsObj.y_axis_legend,
                          'y_fmt':'number',
                          'root_id':this.chartOptions.root_id,
                          'published_date': getSnowflakeStyleDate(0),
                          'render_date': getSnowflakeStyleDate(0),
                          'chart_options': this.chartOptions,
                          'series_labels': this.chartlabels,
                          'series_colors': this.chartOptions.series_colors,
                        };
      console.log("RENDERING CHART",this.chartConfigFilter, this.chartConfigKey);
      renderChart.call(this, renderOptions);
  }

  retrieveData(url) {
      let uchartdata = vchart_vdata;
      this.chartdata = vchart_vdata.data;
      this.chartlabels = vchart_vdata.meta.VARIANTS;

      // Do averaging here...
      // let avg_series = [];
      // for (let ri = 6; ri < uchartdata.length; ++ri) {
      //   const inrow = uchartdata[ri];
      //   let outrow = [];
      //   outrow.push(inrow[0]); // date
      //   let sums = [];
      //   for (let ci = 0; ci < inrow.length-1; ++ci) {
      //     sums.push(0);
      //   }
      //   for (let dj = 0; dj < 7; ++dj) {
      //     for (let ci = 0; ci < inrow.length-1; ++ci) {
      //       sums[ci] += uchartdata[ri-dj][ci+1];
      //     }
      //   }
      //   for (let ci = 0; ci < inrow.length-1; ++ci) {
      //     outrow.push(sums[ci] / 7.0);
      //   }
      //   avg_series.push(outrow);
      // }

      // this.chartdata = avg_series;

      // Splice for dates
      const tsKeys = Object.keys(this.chartdata.time_series);
      tsKeys.forEach((tseriesnom) => {
        let tseries = this.chartdata.time_series[tseriesnom].VALUES;
        let nbr_to_chop = 0;
        tseries.forEach((rec, i) => {
          if (rec.DATE == this.chartOptions.starting_date) {
            nbr_to_chop = i+1;
          }
        });
        if (nbr_to_chop) {
          tseries.splice(0,nbr_to_chop);
        }
        if (this.chartOptions.uncertainty_days) {
          tseries.splice(tseries.length-this.chartOptions.uncertainty_days,this.chartOptions.uncertainty_days); 
        }
      });

      this.renderComponent();

//     window
//       .fetch(url)
//       .then((response) => response.json())
//       .then(
//         function (alldata) {
//           // console.log("Race/Eth data data", alldata.data);
//           this.metadata = alldata.meta;
//           this.chartdata = alldata.data;
//           this.renderComponent();
//         }.bind(this)
//       );
//   }
  
  }
}

window.customElements.define(
  "cagov-chart-dashboard-variant-chart",
  CAGovDashboardVariantChart
);
