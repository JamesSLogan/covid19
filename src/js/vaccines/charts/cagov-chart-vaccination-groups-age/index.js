import template from "./template.js";
import getTranslations from "./../../../common/get-strings-list.js";
import getScreenResizeCharts from "./../../../common/get-window-size.js";
import rtlOverride from "./../../../common/rtl-override.js";
import renderChart from "../../../common/charts/simple-barchart.js";
import applySubstitutions from "./../../../common/apply-substitutions.js";
import { parseSnowflakeDate, reformatJSDate } from "./../../../common/readable-date.js";

class CAGovVaccinationGroupsAge extends window.HTMLElement {
  connectedCallback() {
    console.log("Loading CAGovVaccinationGroupsAge");
    this.translationsObj = getTranslations(this);
    this.innerHTML = template(this.translationsObj);
    // Settings and initial values
    this.nbr_bars = 4;
    let bar_vspace = 60;

    this.chartOptions = {
      // Data
      dataUrl:
        config.equityChartsVEDataLoc + "age/vaccines_by_age_california.json", // Overwritten by county.
      dataUrlCounty:
        config.equityChartsVEDataLoc + "age/vaccines_by_age_<county>.json",
      // Breakpoints
      desktop: {
        fontSize: 14,
        height: 60 + this.nbr_bars * bar_vspace,
        width: 555,
        margin: {
          top: 60,
          right: 80,
          bottom: 0,
          left: 0,
        },
      },
      tablet: {
        fontSize: 14,
        height: 60 + this.nbr_bars * bar_vspace,
        width: 555,
        margin: {
          top: 60,
          right: 80,
          bottom: 0,
          left: 0,
        },
      },
      mobile: {
        fontSize: 12,
        height: 60 + this.nbr_bars * (bar_vspace - 2),
        width: 440,
        margin: {
          top: 60,
          right: 80,
          bottom: 0,
          left: 0,
        },
      },
      retina: {
        fontSize: 12,
        height: 60 + this.nbr_bars * (bar_vspace - 2),
        width: 320,
        margin: {
          top: 60,
          right: 80,
          bottom: 0,
          left: 0,
        },
      },
    };

    getScreenResizeCharts(this);

    this.screenDisplayType = window.charts
      ? window.charts.displayType
      : "desktop";

    this.chartBreakpointValues = this.chartOptions[
      this.screenDisplayType ? this.screenDisplayType : "desktop"
    ];
    this.dimensions = this.chartBreakpointValues;

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

    this.svg = d3
      .select(this.querySelector(".svg-holder"))
      .append("svg")
      .attr("viewBox", [
        0,
        0,
        this.chartBreakpointValues.width,
        this.chartBreakpointValues.height,
      ])
      .append("g")
      .attr("transform", "translate(0,0)");

    // Set default values for data and labels
    this.dataUrl = this.chartOptions.dataUrl;

    this.retrieveData(this.dataUrl, "California");
    this.listenForLocations();

    rtlOverride(this); // quick fix for arabic
  }

  getLegendText() {
    return [
      this.translationsObj.legendLabelVaccines,
      this.translationsObj.legendLabelPopulation,
    ];
  }

  getChartTitle({
    region = "California",
    chartTitle = "People with at least one dose of vaccine administered by race and ethnicity in California",
    chartTitleCounty = "People with at least one dose of vaccine administered by race and ethnicity in [REGION]",
  }) {

    let isCounty = region !== "California" ? true : false;

    let replacedChartTitle = isCounty === false ? chartTitle : chartTitleCounty.replace("[REGION]", region + " County");

    this.translationsObj.chartDisplayTitle = replacedChartTitle;

    return replacedChartTitle;
  }

  resetTitle({
    region = "California",
    chartTitle = "People with at least one dose of vaccine administered by age in California",
    chartTitleCounty = "People with at least one dose of vaccine administered by age in [REGION]",
  }) {

    this.translationsObj.chartDisplayTitle = this.getChartTitle({
      region,
      chartTitle: this.translationsObj.chartTitle,
      chartTitleCounty: this.translationsObj.chartTitleCounty,
    });

    this.querySelector(".chart-title").innerHTML = this.translationsObj.chartDisplayTitle;
  }

  ariaLabel(d) {
    let label = "ARIA BAR LABEL";
    return label;
  }

  listenForLocations() {
    let searchElement = document.querySelector("cagov-county-search");
    searchElement.addEventListener(
      "county-selected",
      function (e) {
        console.log("X County selected", e.detail.filterKey);
        this.county = e.detail.county;
        let searchURL = this.chartOptions.dataUrlCounty.replace(
          "<county>",
          this.county.toLowerCase().replace(/ /g, "")
        );
        this.retrieveData(searchURL, e.detail.county);
      }.bind(this),
      false
    );
  }

  retrieveData(url, regionName) {
    window
      .fetch(url)
      .then((response) => response.json())
      .then(
        function (alldata) {
          this.metadata = alldata.meta;
          this.alldata = alldata.data;

          let publishedDate = parseSnowflakeDate(this.metadata['PUBLISHED_DATE']);
          let collectedDate = parseSnowflakeDate(this.metadata['LATEST_ADMIN_DATE']);
          if (publishedDate.getTime() == collectedDate.getTime()) {
            collectedDate.setDate(collectedDate.getDate() - 1);            
          }
          let footerReplacementDict = {
            'PUBLISHED_DATE' : reformatJSDate( publishedDate ),
            'LATEST_ADMINISTERED_DATE' : reformatJSDate( collectedDate ),
          };

          let footerDisplayText = applySubstitutions(this.translationsObj.chartDataLabel, footerReplacementDict);
          d3.select(this.querySelector(".chart-data-label")).text(footerDisplayText);

          let croppedData = alldata.data.filter(function(a){return a.CATEGORY !== 'Unknown'});
          this.alldata = croppedData;
          this.popdata = null;
          if ('POP_METRIC_VALUE' in this.alldata[0]) {
            console.log("Pop data found for age chart");
            this.popdata = this.alldata.map(row => {
              return {CATEGORY: row.CATEGORY, METRIC_VALUE: row.POP_METRIC_VALUE};
            });
          }
          renderChart.call(this,null,this.popdata,null,'ve-age');
          this.resetTitle({
            region: regionName, 
            chartTitle: this.translationsObj.chartTitle,
            chartTitleCounty: this.translationsObj.chartCounty
          });
        }.bind(this)
      );
  }
}

window.customElements.define(
  "cagov-chart-vaccination-groups-age",
  CAGovVaccinationGroupsAge
);
