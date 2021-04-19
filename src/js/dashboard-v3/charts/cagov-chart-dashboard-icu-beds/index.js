import template from "./../common/histogram-template.js";
import getTranslations from "../../../common/get-strings-list.js";
import getScreenResizeCharts from "../../../common/get-window-size.js";
import rtlOverride from "../../../common/rtl-override.js";
import renderChart from "../common/histogram.js";
import { reformatReadableDate } from "../../../common/readable-date.js";
import applySubstitutions from "./../../../common/apply-substitutions.js";
import formatValue from "./../../../common/value-formatters.js";

// cagov-chart-dashboard-icu-beds
class CAGovDashboardICUBeds extends window.HTMLElement {
  connectedCallback() {
    console.log("Loading CAGovDashboardICUBeds");
    this.translationsObj = getTranslations(this);

    // Settings and initial values
    this.chartOptions = {
      chartName: 'cagov-chart-dashboard-icu-beds',
      // Data
      dataUrl:
        config.chartsStateDashTablesLoc + "icu-beds/california.json", // Overwritten by county.
      dataUrlCounty:
        config.chartsStateDashTablesLoc + "icu-beds/<county>.json",

      desktop: {
        fontSize: 14,
        width: 420, height: 300,
        margin: { left: 50, top: 30,  right: 20, bottom: 45  },
      },
      tablet: {
        fontSize: 14,
        width: 420, height: 300,
        margin: { left: 50, top: 30,  right: 20, bottom: 45  },
      },
      mobile: {
        fontSize: 12,
        width: 420, height: 300,
        margin: { left: 50, top: 30,  right: 20, bottom: 45  },
      },
      retina: {
        fontSize: 12,
        width: 420, height: 300,
        margin: { left: 50, top: 30,  right: 20, bottom: 45  },
      },
    };

    getScreenResizeCharts(this);

    this.screenDisplayType = window.charts
      ? window.charts.displayType
      : "desktop";

    this.chartBreakpointValues = this.chartOptions[
      this.screenDisplayType ? this.screenDisplayType : "desktop"
    ];
    this.chartBreakpointValues = JSON.parse(JSON.stringify(this.chartBreakpointValues));
    this.dimensions = this.chartBreakpointValues;
    this.dimensions.margin.right = 20;

    const handleChartResize = () => {
      getScreenResizeCharts(this);
      this.screenDisplayType = window.charts
        ? window.charts.displayType
        : "desktop";
      this.chartBreakpointValues = this.chartOptions[
        this.screenDisplayType ? this.screenDisplayType : "desktop"
      ];
    };

    window.addEventListener("resize", handleChartResize);

    // Set default values for data and labels
    this.dataUrl = this.chartOptions.dataUrl;

    this.retrieveData(this.dataUrl, 'California');

    rtlOverride(this); // quick fix for arabic

    this.listenForLocations();
  }

  ariaLabel(d, baselineData) {
    let caption = ''; // !!!
    return caption;
  }

  getLegendText() {
    return [];
    //   this.translationsObj.chartLegend1,
    //   this.translationsObj.chartLegend2,
    // ];
  }

  renderExtras(svg, data, x, y) {
  }

  getTooltipContent(di) {
    const barSeries = this.chartdata.time_series.ICU_BEDS.VALUES;
    const lineSeries = this.chartdata.time_series.ICU_BEDS.VALUES;
    // console.log("getTooltipContent",di,lineSeries);
    const repDict = {
      DATE:   reformatReadableDate(barSeries[di].DATE),
      VALUE:formatValue(barSeries[di].VALUE,{format:'integer'}),
    };
    return applySubstitutions(this.translationsObj.tooltipContent, repDict);
  }

  renderComponent(regionName) {
    const repDict = {
      TOTAL:formatValue(this.chartdata.latest.ICU_BEDS.TOTAL,{format:'integer'}),
      CHANGE:formatValue(Math.abs(this.chartdata.latest.ICU_BEDS.CHANGE),{format:'integer'}),
      CHANGE_FACTOR:formatValue(Math.abs(this.chartdata.latest.ICU_BEDS.CHANGE_FACTOR),{format:'percent'}),
    };

    this.translationsObj.post_chartTitle = applySubstitutions(this.translationsObj.chartTitle, repDict);
    this.translationsObj.post_chartLegend1 = applySubstitutions(this.translationsObj.chartLegend1, repDict);
    this.translationsObj.post_chartLegend2 = applySubstitutions(this.chartdata.latest.ICU_BEDS.CHANGE_FACTOR >= 0? this.translationsObj.chartLegend2Increase : this.translationsObj.chartLegend2Decrease, repDict);
    this.translationsObj.currentLocation = regionName;

    this.innerHTML = template(this.translationsObj);

    let renderOptions = { 'tooltip_func':this.tooltip,
                      'extras_func':this.renderExtras,
                      'time_series_bars':this.chartdata.time_series['ICU_BEDS'].VALUES,
                      'time_series_line':this.chartdata.time_series['ICU_BEDS'].VALUES,
                      'root_id':'icu_beds',
                      'x_axis_legend':'Reported date',
                      'month_modulo':2,
                    };
    renderChart.call(this, renderOptions);
    
  }

  retrieveData(url, regionName) {
    window
      .fetch(url)
      .then((response) => response.json() )
      .then(
        function (alldata) {
          this.metadata = alldata.meta;
          this.chartdata = alldata.data;
          this.renderComponent(regionName);
        }.bind(this)
      );
    }

  listenForLocations() {
    let searchElement = document.querySelector("cagov-county-search");
    searchElement.addEventListener(
      "county-selected",
      function (e) {
        this.county = e.detail.county;
        let searchURL = this.chartOptions.dataUrlCounty.replace(
          "<county>",
          this.county.toLowerCase().replace(/ /g, "_")
        );
        this.retrieveData(searchURL, e.detail.county);
      }.bind(this),
      false
    );
  }
}

window.customElements.define(
  "cagov-chart-dashboard-icu-beds",
  CAGovDashboardICUBeds
);
