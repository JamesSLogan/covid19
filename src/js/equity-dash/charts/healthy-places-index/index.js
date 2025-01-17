// import { stackOffsetNone } from 'd3';
// we are not yet importing d3 because we ran into some circular dependency issues and we can't get latest version to transpile properly so there are major IE problems. Importing it has to be tested against IE
// import Toolline from './tooltip.js'; // Not used, delete?
import Tooltip from "./tooltip.js";
import template from "./template.js";
import getTranslations from "./../../../common/get-strings-list.js";
import getScreenResizeCharts from "./../../../common/get-window-size.js";
import { chartOverlayBox, chartOverlayBoxClear } from "../../chart-overlay-box.js";
import rtlOverride from "./../../../common/rtl-override.js";
import { reformatReadableDate, parseSnowflakeDate, reformatJSDate } from "../../../common/readable-date.js";
import applySubstitutions from "./../../../common/apply-substitutions.js";



class CAGOVChartD3Lines extends window.HTMLElement {
  connectedCallback() {
    this.translationsObj = this.getTranslations(this);
    // this.innerHTML = this.translationsObj; // not currently using a template.
    this.innerHTML = template(this.translationsObj);
    
    // Settings and initial values
    // let debugLatest = false;
    this.chartOptions = {
      // Data
      dataUrl: config.equityChartsDataLoc + "/equitydash/healthequity-california.json",  // Overwritten by county.
      statusUrl: config.statusLoc+"/last_equity_update.json", // Overwritten by county.
      // state: "California",
      // county: "California",
      // Style
      chartColors: ["#000000", "#2772B3"],
      // Breakpoints
      desktop: {
        width: 613,
        height: 355,
        margin: { top: 30, right: 24, bottom: 40, left: 46 },
        legendPosition: {
          x: 300,
          y: 10
        }
      },
      tablet: {
        width: 440,
        height: 355,
        margin: { top: 30, right: 24, bottom: 40, left: 46 },
        legendPosition: {
          x: 160,
          y: 18
        }
      },
      mobile: {
        width: 440,
        height: 600,
        margin: { top: 30, right: 24, bottom: 40, left: 46 },
        legendPosition: {
          x: 160,
          y: 18
        }
      },
      retina: {
        width: 320,
        height: 450,
        margin: { top: 30, right: 24, bottom: 40, left: 46 },
        legendPosition: {
          x: 100,
          y: 18
        }
      },
    };
    // if (debugLatest) {
    //   this.chartOptions.dataUrl = this.chartOptions.dataUrl.replace('reviewed','to-review');
    //   console.log("Latest",this.chartOptions.dataUrl);
    // }

    getScreenResizeCharts(this);
    this.screenDisplayType = window.charts
      ? window.charts.displayType
      : "desktop";
    this.chartBreakpointValues = this.chartOptions[
      this.screenDisplayType ? this.screenDisplayType : "desktop"
    ];

    // Choose settings for current screen display.
    // Display content & layout dimensions
    const handleChartResize = () => {
      getScreenResizeCharts(this);
      this.screenDisplayType = window.charts
        ? window.charts.displayType
        : "desktop";
      this.chartBreakpointValues = this.chartOptions[
        this.screenDisplayType ? this.screenDisplayType : "desktop"
      ];
    };

    // @TODO connect a debouncer
    window.addEventListener("resize", handleChartResize);

    // jbum: all text for line chart collected here...
    this.textLabels = {
      yAxisLabel: this.translationsObj["y-axis-label"], // Test positivity
      data1Legend: this.translationsObj["data1-legend"], // Statewide positivity
      data1LegendLocal: this.translationsObj["data1-legend-local"], // 'placeholderForDynamicLocation test positivity', // appended to county name
      data2Legend: this.translationsObj["data2-legend"], // 'Health equity quartile positivity',
      missingDataCaption: this.translationsObj["missing-data-caption"], // 'The health equity metric is not<br>applied to counties with a population<br>less than 106,000.',
      dataAnomaliesCaption: this.translationsObj["data-anomalies-caption"], // Due to reporting anomalies, we cannot display this data accurately.
    };

    this.svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, this.chartBreakpointValues.width, this.chartBreakpointValues.height]);

      Promise.all([
        window.fetch(this.chartOptions.dataUrl),
        window.fetch(this.chartOptions.statusUrl)
      ])
      .then(function (responses) {
        return Promise.all(responses.map(function (response) {
          return response.json();
        }));
      }).then((bothdata) => {
        this.alldata = bothdata[0];
        this.statusdata = bothdata[1];
        this.writeChart(this.alldata, this.svg, this.textLabels.data1Legend, this.textLabels.data2Legend);
        // this.innerHTML = `<div class="svg-holder"></div>`;
        this.querySelector(".svg-holder").appendChild(this.svg.node());
      });

    let legendLabels = [
      this.textLabels.data1Legend,
      this.textLabels.data2Legend,
    ];

    this.legend = this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.chartBreakpointValues.legendPosition.x},${this.chartBreakpointValues.legendPosition.y})`);

    this.writeLegendColors(this.chartOptions.chartColors, this.legend);
    this.writeLegendLabels(legendLabels, this.legend);
    this.listenForLocations();
    this.classList.remove("d-none"); // this works
    if (this.querySelector('.d-none') !== null) { // doesn't work
      this.querySelector('.d-none').classList.remove("d-none");
    }

    rtlOverride(this); // quick fix for arabic
  }

  listenForLocations() {
    let searchElement = document.querySelector("cagov-county-search");
    searchElement.addEventListener(
      "county-selected",
      function (e) {
        this.county = e.detail.county;
        // console.log("Got County: " + this.county);
        let legendText = this.textLabels.data1LegendLocal.replace(
          "placeholderForDynamicLocation",
          this.county
        );
        let legendText2 = this.textLabels.data2Legend;

        window
          .fetch(
            config.equityChartsDataLoc +
              "/equitydash/healthequity-" +
              this.county.toLowerCase().replace(/ /g, "") +
              ".json"
          )
          .then((response) => response.json())
          .then((alldata) => {
            this.writeChart(alldata, this.svg, legendText, legendText2);
          });
      }.bind(this),
      false
    );
  }

  // Related to the line that appears on hover
  bisect(data, date) {
    const bisectDate = d3.bisector((d) => parseSnowflakeDate(d.DATE)).left;
    // this is consistently failing and returning the default==1
    const i = Math.min(data.length - 1, bisectDate(data, date, 1));
    const a = data[i - 1],
      b = data[i];
    // console.log("date = " + date+ " i= " + i);
    return date - parseSnowflakeDate(a.DATE) > parseSnowflakeDate(b.DATE) - date ? b : a;
  }


  writeChart(alldata, svg, data1Legend, data2Legend) {
    let component = this;

    // DATE
    console.log("LINE CHART ALL DATA",this.alldata);
    let publishedDate = parseSnowflakeDate(this.statusdata.PUBLISH_DATE.substr(0,10)); 
    // !! don't know this date yet...
    let reportDate = parseSnowflakeDate(this.statusdata.PUBLISH_DATE.substr(0,10));
    reportDate.setDate(reportDate.getDate() - 1); // subtract 1 day to date on file

    let footerReplacementDict = {
      'PUBLISHED_DATE' : reformatJSDate( publishedDate ),
      'REPORT_DATE' : reformatJSDate( reportDate ),
    };
    const post_footerText = applySubstitutions(this.translationsObj.footerText, footerReplacementDict);
    d3.select(this.querySelector(".chart-data-label")).text(post_footerText);

    component.dims = this.chartBreakpointValues !== undefined ? this.chartBreakpointValues : this.chartOptions.desktop; // Patch error until we can investigate it
    let data = alldata.county_positivity_all_nopris;
    let data2 = alldata.county_positivity_low_hpi;

    let updateDate =  reformatReadableDate( data2[data2.length-1].DATE );
    // using document since the footnote lies outside this element
    document.querySelectorAll('span[data-replacement="d3-lines-report-date"]').forEach(elem => {
      // console.log("Got date span");
      elem.innerHTML = updateDate;
    });

    // console.log("Overall Data ", data);
    // console.log("Equity Data2 ", data2);
    let missing_eq_data =
      data2.filter((d) => null == d.METRIC_VALUE).length > 0;
    let anomalies_data = data[0].COUNTY === "San Diego";
    let using_data_overlay = (missing_eq_data || anomalies_data);

    let legendLabels = [data1Legend, this.textLabels.data2Legend];
    this.rewriteLegend(this.svg, legendLabels);
    svg
      .selectAll(".legend")
      .attr("visibility", using_data_overlay ? "hidden" : "visible");
    // console.log("dims",this.chartBreakpointValues);

    let minDate = d3.min(missing_eq_data ? data : data2, (d) => parseSnowflakeDate(d.DATE));
    minDate.setDate(minDate.getDate() - 1);
    let maxDate = d3.max(data, (d) => parseSnowflakeDate(d.DATE));
    maxDate.setDate(maxDate.getDate() + 1);
    let xbounds = {
      min: minDate,
      max: maxDate,
    };

  
    let x = d3
      .scaleTime()
      .domain([xbounds.min, xbounds.max])
      .range([this.chartBreakpointValues.margin.left, this.chartBreakpointValues.width - this.chartBreakpointValues.margin.right]);

    // don't allow max_y to exceed 100%, since that would be silly
    let max_y_1 =  d3.max(missing_eq_data ? data : data2, (d) => d.METRIC_VALUE);
    let max_y_2 =  d3.max(data, (d) => d.METRIC_VALUE);
    let max_y_ab = Math.max(max_y_1, max_y_2);

    let max_y = Math.min(
      1,
      max_y_ab * 1.4
    );

    let y = d3
      .scaleLinear()
      .domain([0, max_y]) // using county_positivity_low_hpi because that has higher numbers
      .range([
        this.chartBreakpointValues.height - this.chartBreakpointValues.margin.bottom,
        this.chartBreakpointValues.margin.top,
      ]);
    let xRange = x.range();
    let yRange = y.range();
    let chartWidth = xRange[1] - xRange[0]; // 128.5
    let chartHeight = yRange[1] - yRange[0]; // -52
    // console.log("Chart width", chartWidth, "height", chartHeight);
    
    // jbum note: 14 is a magic number that aligns axis to the line and tooltips
    // note the left margin is 30, so I'm not sure why it's so odd
    let xAxis = (g) =>
      g
        .attr("transform", "translate(0," + this.chartBreakpointValues.margin.bottom + ")" )
        .attr("font-weight", "bold" )
        .call(
          d3
            .axisBottom(x)
            .ticks(d3.timeWeek.every(1))
            // .tickFormat(d3.timeFormat("%b. %d"))  // d3 timeFormatDefaultLocale is currently breaking, so using a non-d3 method
            .tickFormat(d => d.toLocaleString(document.documentElement.lang, { month: "short", day: 'numeric' }))
            .tickSize(-chartHeight)
        )
        // .call(g => g)
        .call((g) => g.select(".domain").remove());

    let nbr_ticks = Math.min(10, 1 + Math.floor(max_y * 100));
    nbr_ticks = Math.max(5,nbr_ticks);
    let y_tick_fmt = d3.format(".1%");

    let yAxis = (g) =>
      g
        .attr("transform", "translate(" + this.chartBreakpointValues.margin.left + ", 0)")
        .attr("font-weight", "bold" )
        .call(
          d3
            .axisLeft(y)
            .ticks(nbr_ticks)
            .tickFormat(y_tick_fmt)
            .tickSize(-chartWidth)
        )
        // .call(g => g)
        .call((g) => g.select(".domain").remove());

    let yAxisLabel = (g) =>
      g
        .append("text")
        .attr(
          "transform",
          "translate(" + 0 + " ," + (this.chartBreakpointValues.margin.top - 10) + ")"
        )
        .style("text-anchor", "left")
        .attr("font-weight", "bold")
        .text(component.textLabels.yAxisLabel)
        .attr("class", "y-label");
    
    let line = d3
      .line()
      .x((d, i) => {
        return x(parseSnowflakeDate(d.DATE));
      })
      .y((d) => {
        return y(d.METRIC_VALUE);
      });

    //call line chart county_positivity_all_nopris
    svg.selectAll(".county_positivity_all_nopris").remove();
    svg.selectAll(".tick").remove(); // remove previous axes annotations
    svg.selectAll(".y-label").remove();
    // d3.selectAll(".tooltip-container--d3-lines").remove();

    if (!using_data_overlay) {
      svg
        .append("path")
        .datum(
          data.sort(function (a, b) {
            return a.DATE > b.DATE;
          })
        )
        .attr("fill", "none")
        .attr("stroke", this.chartOptions.chartColors[0])
        .attr("stroke-width", 3)
        .attr("class", "county_positivity_all_nopris")
        .attr("d", line);
    }

    //call line chart county_positivity_low_hpi
    svg.selectAll(".county_positivity_low_hpi").remove();

    if (!using_data_overlay) {
      svg
        .append("path")
        .datum(
          data2.sort(function (a, b) {
            return a.DATE > b.DATE;
          })
        )
        .attr("fill", "none")
        .attr("stroke", this.chartOptions.chartColors[1])
        .attr("stroke-width", 3)
        .attr("class", "county_positivity_low_hpi")
        .attr("d", line);
    }

    let xg = svg.append("g").call(xAxis);
    let yg = svg.append("g").call(yAxis);
    // debug ticks
    // xg.selectAll("line").style("stroke", "red");
    // yg.selectAll("line").style("stroke", "green");
    svg.append("g").call(yAxisLabel);

    let is_debugging_infobox = false;
    let is_debugging_anomalies = false;
    let boxClass = "chartOverlay-d3-lines";
    if (missing_eq_data || is_debugging_infobox) {
      chartOverlayBox(svg,                      
            "cagov-chart-d3-lines",     // class of chart
            boxClass,                   // class of box
            this.chartBreakpointValues, // dimensions dict (contains width,height)
            this.textLabels.missingDataCaption // caption
            );
    } else if (anomalies_data || is_debugging_anomalies) {
      chartOverlayBox(svg,                      
            "cagov-chart-d3-lines",     // class of chart
            boxClass,                   // class of box
            this.chartBreakpointValues, // dimensions dict (contains width,height)
            this.textLabels.dataAnomaliesCaption // caption
            );
    } else {
      chartOverlayBoxClear(svg, boxClass);
    }

    //tooltip
    svg.on("mousemove", null);
    svg.on("mouseleave touchend", null);

    if (!using_data_overlay) {
      const tooltip = new Tooltip(true, y);
      const tooltip2 = new Tooltip(false, y);

      // Handle mouse events.
      svg
        .on("mousemove", (event) => {
          // console.log("move: " + event.offsetX);
          // coords are container screen-coords, and need to be scaled/translated
          // to x display bounds before passed to x.invert
          var xy = d3.pointer(event);
          let data1Isgreater = this.doMath(data, data2, x, y, xy);
          
          // console.log("event: ",xy);
          tooltip.show(this.bisect(data, x.invert(xy[0])), x, y, data1Isgreater, data1Legend );
          if (!using_data_overlay) {
            tooltip2.show(this.bisect(data2, x.invert(xy[0])), x, y, !data1Isgreater, data2Legend);
          }        
        
        })
        .on("mouseleave touchend", (event) => {
          // console.log("leave");
          tooltip.hide();
          if (!using_data_overlay) {
            tooltip2.hide();
          }
        });

      svg.append(() => tooltip.node);
      if (!using_data_overlay) {
        svg.append(() => tooltip2.node);
      }
    }
  }

  rewriteLines(svg, data, x, y) {
    svg
      .selectAll(".barshere rect")
      .data(data)
      .transition()
      .duration(300)
      .attr("x", (d, i) => x(i))
      .attr("y", (d) => y(d.CASE_RATE_PER_100K))
      .attr("height", (d) => y(0) - y(d.CASE_RATE_PER_100K));
  }

  writeLegendColors(legendColors, legend) {
    legend
      .selectAll("rect")
      .data(legendColors)
      .enter()
      .append("rect")
      .attr("x", function (d, i) {
        // return i * 200 + 0;
        return 0;
      })
      .attr("y", function (d, i) {
        // return 2; // i * 6;
        return i * 20  - 10;
      })
      .attr("width", 20)
      .attr("height", 3)
      .attr("fill", function (d, i) {
        return d;
      });
  }

  writeLegendLabels(legendLabels, legend) {
    // console.log("write legend width",this.chartBreakpointValues.width);
    legend
      .selectAll("text")
      .data(legendLabels)
      .enter()
      .append("text")
      .text(function (d) {
        return d;
      })
      .attr("x", function (d, i) {
        // return i * 100 + 25;
        return 25;
      })
      .attr("y", function (d, i) {
        // return -1; // i * 6 - 2;
        return i * 20 - 10;
      })
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .attr("dominant-baseline", "hanging");
  }

  rewriteLegend(svg, legendLabels) {
    svg
      .selectAll(".legend text")
      .data(legendLabels)
      .text((d) => d);
  }

  getTranslations() {
    let translations = getTranslations(this);
    return translations;
  }

  // @todo Rename this function.
  doMath(data, data2, x, y, xy) {
    
      let value1 = this.bisect(data, x.invert(xy[0]))
      let value2 = this.bisect(data2, x.invert(xy[0]))

      let newy1 = y(value1.METRIC_VALUE) + 4
      let newy2 = y(value2.METRIC_VALUE) + 4

      return (newy1 > newy2);

    };
}
window.customElements.define("cagov-chart-d3-lines", CAGOVChartD3Lines);
