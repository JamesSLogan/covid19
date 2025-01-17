import { parseSnowflakeDate} from "../../../common/readable-date.js";

function writeLine(svg, data, fld, x, y, { root_id='barid', line_id='line_s0', color='black', crop_floor=true }) {
  let max_y_domain = y.domain()[1];
  let max_x_domain = x.domain()[1];
  let component = this;

  // let i = 0;
  // let trimStart = 0;
  // while (i < data.length-1 && data[i][fld] == "NA" || data[i][fld] == "Inf") {
  //   trimStart += 1;
  //   i += 1;
  // }
  // let trimmedData = data.slice(trimStart);

  let groups = svg.append("g")
    .attr("class","fg-line "+root_id+" "+line_id);
  // if (line_id == "line_s3") {
  //   groups.attr("stroke-dasharray","2 6");
  // }
  data.forEach(d => {
    if (typeof d[fld] != "number") {
      console.log("Problem with field",fld,d.DATE);
    }
  });
  groups.append('path')
    .datum(data)
      .attr("d", d3.line()
        .x(function(d,i) { return x(i) })
        .y(function(d) { return y(crop_floor? Math.max(0,d[fld]) : d[fld]) })
        );
}

// Date Axis
function writeXAxis(svg, data, date_fld, x, y, 
  { week_modulo=3,
    root_id='barid'} ) {
  const tick_height = 4;
  const tick_upper_gap = 1;
  const tick_lower_gap = 12;
  const axisY = this.dimensions.height - this.dimensions.margin.bottom;

  let xgroup = svg.append("g")
      .attr("class",'date-axis')
      // .attr('style','stroke-width: 0.5px; stroke:black;');

  let last_mon_idx = 0;
  let last_year_idx = 0;
  let month_modulo = data.length > 366? 3 : 1;

  data.forEach((d,i) => {
    const ymd = d[date_fld].split('-');
    const year_idx = parseInt(ymd[0]);
    const mon_idx = parseInt(ymd[1]);

    if (i % week_modulo == 0) {
      const day_idx = parseInt(ymd[2]);

      if (day_idx == 1) {
        // const date_caption = mon_idx+'/1'; // ?? localize
        const sdate = parseSnowflakeDate(d[date_fld]);
        const monthStr = sdate.toLocaleString('default', { month: 'short' });


        let subg = xgroup.append("g")
              .attr('class','x-tick');
        subg.append('line')
        .attr('x1', x(i))
        .attr('y1', axisY+tick_upper_gap)
        .attr('x2', x(i))
        .attr('y2',axisY+tick_upper_gap+tick_height);
        subg.append('text')
         .text(monthStr)
         // .attr('style','font-family:sans-serif; font-weight:300; font-size: 0.75rem; fill:black;text-anchor: middle; dominant-baseline:hanging;')
         .attr("x", x(i))
         .attr("y", axisY+tick_upper_gap+tick_height+tick_lower_gap) // +this.getYOffset(i)
      }

      // let subg = xgroup.append("g")
      //       .attr('class','x-tick');
      
      // if (i == 0 || i == data.length-1) {
      //   const date_caption = mon_idx+'/'+day_idx + '/'+year_idx; // ?? localize
      //   let text_anchor = (i == 0)? 'start' : 'end';
      //   subg.append('text')
      //     .text(date_caption)
      //     .attr('style','font-family:sans-serif; font-weight:300; font-size: 0.85rem; fill:black;text-anchor: '+text_anchor+'; dominant-baseline:hanging;')
      //     .attr("x", x(i))
      //     .attr("y", axisY+tick_upper_gap+tick_height+tick_lower_gap); // +this.getYOffset(i)
      // }
      // last_mon_idx = mon_idx;
      // last_year_idx = year_idx;
    }
  });
  // if (x_axis_legend) {
  //   xgroup.append('text')
  //   .attr('class','x-axis-legend')
  //   .attr('style','font-family:sans-serif; font-weight:300; font-size: 0.75rem; fill:black;text-anchor: end; dominant-baseline:middle;')
  //   .text(x_axis_legend)
  //   .attr("x", this.dimensions.width - this.dimensions.margin.right)
  //   .attr("y", this.dimensions.height-6) // +this.getYOffset(i)
  // }
}

function writePendingArea(svg, x, y, 
  { pending_days=7,
    root_id='barid'})
{
    let xgroup = svg.append("g")
    .attr("class",'pending-block');

    const max_x_domain = x.domain()[1];
    const min_y_domain = y.domain()[0];
    const max_y_domain = y.domain()[1];
    let nbr_pending = pending_days;

    xgroup.append('rect')
      .attr('style','fill:black;opacity:0.05;')
      .attr("x",x(max_x_domain-nbr_pending))
      .attr("y",y(max_y_domain))
      .attr("width",x(max_x_domain) - x(max_x_domain-nbr_pending))
      .attr("height",y(min_y_domain)-y(max_y_domain));
    xgroup.append('text')
      .attr('style','font-family:sans-serif; fill:black; font-weight:300; font-size: 0.8rem; text-anchor: end; dominant-baseline:auto;')
      .text("Pending")
      .attr("x",x(max_x_domain))
      .attr("y",y(max_y_domain)-4);
}

// Formatter Factory
// supported formats: num/number, pct, integer
function getFormatter(max_v,{hint='num',digits=0})
{
  if (hint == 'pct') {
    const digits = max_v < .01? 2 : max_v < .1? 1 : 0;
    const fmtr = new Intl.NumberFormat(
        "us",  { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }    );
        return fmtr.format;
  } else {
    // assume num/number
    if (max_v < 4000) {
      const digits = (hint == 'integer')? 0 : max_v < .1? 2 : max_v < 10? 1 : 0;
      const fmtr = new Intl.NumberFormat( "us", { style: "decimal", minimumFractionDigits: digits, maximumFractionDigits: digits } );
      return fmtr.format;
    } else if (max_v < 1000000) {
      const digits = max_v < 4000? 1 : 0;
      const fmtr = new Intl.NumberFormat( "us", { style: "decimal", minimumFractionDigits: digits, maximumFractionDigits: digits } );
      return function(v) {
        return fmtr.format(v/1000)+"K";
      };
    } else if (max_v < 1000000000) {
      const digits = max_v < 4000000? 1 : 0;
      const fmtr = new Intl.NumberFormat( "us", { style: "decimal", minimumFractionDigits: digits, maximumFractionDigits: digits } );
      return function(v) {
        return fmtr.format(v/1000000)+"M";
      };
      
    } else {
      const digits = max_v < 4000000000? 1 : 0;
      const fmtr = new Intl.NumberFormat( "us", { style: "decimal", minimumFractionDigits: digits, maximumFractionDigits: digits } );
      return function(v) {
        return fmtr.format(v/1000)+"M";
      };
    }
  }
}

function writeYAxis(svg, x, y, 
                        { y_fmt='num',
                          root_id='barid' }) {
  const y_div = getAxisDiv(y,{'hint':y_fmt});
  let ygroup = svg.append("g")
      .attr("class",'left-y-axis');

  const max_y_domain = y.domain()[1];
  const min_x_domain = x.domain()[0];
  const max_x_domain = x.domain()[1];
  // console.log("Left Axis",max_y_domain, root_id, y_fmt);
  const tick_gap = 10;
  let myFormatter = getFormatter(max_y_domain, { hint:y_fmt });
  for (let yi = 0; yi <= max_y_domain; yi += y_div) {
    let y_caption = myFormatter(yi);
    let subg = ygroup.append("g")
      .attr('class','y-tick');

    subg.append('line')
      .attr('style','stroke-width: 0.5px; stroke:black; opacity:0.15;')
      .attr('x1', x(max_x_domain))
      .attr('y1', y(yi))
      .attr('x2', x(min_x_domain))
      .attr('y2', y(yi));

    subg.append('text')
      .text(y_caption)
      .attr('style','font-family:sans-serif; font-weight:300; font-size: 0.85rem; fill:black;text-anchor: end; dominant-baseline:middle;')
      .attr("x", x(min_x_domain)-tick_gap)
      .attr("y", y(yi)) // +this.getYOffset(i)
  }
}



// Convert 
function getDataIndexByX(xScale, yScale, xy)
{
  let x = xy[0];
  let y = xy[1];
  let xdi = xScale.invert(x);
  if (xdi >= 0 && xdi <= xScale.domain()[1] ) {
    return Math.round(xdi);
  }
  return null;
}

function showTooltip(event, xy, dataIndex, xscale, yscale)
{
  let tooltip = this.tooltip;
  let content = this.getTooltipContent(dataIndex); 
  tooltip.html(content);
  tooltip.style("left",`${Math.min(this.dimensions.width-280,event.offsetX)}px`);
  // console.log("Tool top L, O, y",event.layerY, event.offsetY, event.y);
  // tooltip.style("top",`${event.layerY+60}px`)
  tooltip.style("top",`${(event.offsetY+120)}px`);
  // d3.select(this).transition();
  tooltip.style("visibility", "visible");
  // console.log("TOOLTIP",content,this.tooltip);

  this.svg.selectAll('g.tt-marker').remove();
  const line_start = this.dimensions.margin.top;
  const line_height = (this.dimensions.height - this.dimensions.margin.bottom) - line_start;

  this.svg
    .append('g')
    .attr('class','tt-marker')
    .append('rect')
    .attr("x",xscale(dataIndex)-0.5)
    .attr("y",line_start)
    .attr("width",1)
    .attr("height",line_height);
}

function hideTooltip()
{
  let tooltip = this.tooltip;
  // d3.select(this).transition().duration(200);
  this.tooltip.style("visibility", "hidden");
  this.svg.selectAll('g.tt-marker').remove();
}

/**
 * This function produces a tick-division (similar to d3.scale.ticks()[1]) which optimizes for about 5 grid lines 
 * (as opposed to D3's 10) with pretty divisions.
 * @param {*} ascale 
 * @returns 
 */
function getAxisDiv(ascale,{hint='num'}) {
  // return ascale.ticks()[1];
  const max_y = ascale.domain()[1];
  const log_y = Math.log10(max_y);
  const floor_log_y = Math.floor(log_y);
  const best_10 = Math.pow(10, floor_log_y);
  const log_diff = (log_y - floor_log_y);
  if (log_diff < 0.176)     var optimal_div = 5; // 150/100
  else if (log_diff < 0.477) var optimal_div = 2; // 300/100
  else if (log_diff < 0.778) var optimal_div = 1; // 600/100
  else                       var optimal_div = 0.5;
  // const optimal_divs = [5,2,1,1/2][bucket];
  let result = best_10/optimal_div;
  if (hint == 'integer' && result < 1) {
    result = 1;
  }
  return result;
}

/**
 * Render categories.
 * @param {*} extrasFunc @TODO what are the inputs?
 */

 export default function renderChart({
    tooltip_func = null,
    extras_func = null,
    chartdata = null,
    series_fields = null,
    series_colors = null,
    x_axis_field = null,
    line_date_offset = 0,
    show_pending = false,
    y_fmt = 'num',
    // pending_weeks = 0,
    // pending_legend = '',
    // pending_mode = 'gray',
    crop_floor = false,
    // chart_mode = 'weekly',
    root_id = "postvaxid" } )  {

    console.log("renderChart",root_id);
    // d3.select(this.querySelector("svg g"))
    //   .attr('style','font-family:sans-serif;font-size:16px;');

    const lastDateSnowFlake = chartdata[chartdata.length-1].DATE;
    const lastDateJ = parseSnowflakeDate(lastDateSnowFlake);
    const lastday = lastDateJ.getDate();
    // as day goes from 1->16, padding goes from 35 -> 0
    if (lastday < 6) {
      const padding = 2+(35 * 1-(lastday/5.0));
      this.dimensions.margin.right = padding;
    }



    this.svg = d3
      .select(this.querySelector(".svg-holder"))
      .append("svg");

    // this.svg.selectAll("g").remove();
    this.svg
      .attr("viewBox", [
        0,
        0,
        this.chartBreakpointValues.width,
        this.chartBreakpointValues.height,
      ]);

     this.svg.append("g")
           .attr("transform", "translate(0,0)")
           .attr("style", "fill:#CCCCCC;");
     

    this.tooltip = d3
      .select(this.chartOptions.chartName)
      .append("div")
      .attr("class", "tooltip-container")
      .text("Empty Tooltip");

    // Prepare and draw the two lines here... using chartdata, seriesN_field and weeks_to_show
    // console.log("Chart data",chartdata);
    let max_y_domain = Math.max(d3.max(chartdata, r => r[series_fields[1]]), d3.max(chartdata, r => r[series_fields[2]]));
    max_y_domain = Math.max(max_y_domain, d3.max(chartdata, r => r[series_fields[0]]));
    let min_y_domain = 0;
    this.yline = d3
    .scaleLinear()
    .domain([min_y_domain, max_y_domain]).nice()  // d3.max(data, d => d.METRIC_VALUE)]).nice()
    .range([this.dimensions.height - this.dimensions.margin.bottom, this.dimensions.margin.top]);

    const LINE_OFFSET_X = line_date_offset;
    this.xline = d3
    .scaleLinear()
    .domain([LINE_OFFSET_X+0,LINE_OFFSET_X+chartdata.length-1+(show_pending? this.chartOptions.pending_days : 0)])
    .range([
        this.dimensions.margin.left,
        this.dimensions.width - this.dimensions.margin.right
        ]);

    // let pending_units = pending_weeks * (chart_mode == 'weekly'? 1 : 7);

    series_fields.forEach((sf, i) => {
      writeLine.call(this, this.svg, chartdata, sf, this.xline, this.yline, 
        { root_id:root_id+"_l"+(i+1), line_id:'line_s'+(i+1), crop_floor:crop_floor, color:series_colors[i]});
    });
    
    if (show_pending) {
      writePendingArea.call(this, this.svg, this.xline, this.yline,
                        {pending_days:this.chartOptions.pending_days,root_id:root_id+'_pending'});
    }    


    // Write Y Axis, favoring line on left, bars on right
    writeYAxis.call(this, this.svg, this.xline, this.yline,
         {y_fmt:y_fmt, root_id:root_id});
    writeXAxis.call(this, this.svg, chartdata, x_axis_field, this.xline, this.yline,
      {week_modulo: 1, root_id:root_id} );

    // writeLegends.call(this, this.svg, chartdata, series_legends, series_colors, this.xline, this.yline);

    if (extras_func) {
      extras_func.call(this, this.svg);
    }

    this.svg
    .on("mousemove focus", (event) => {
      let xy = d3.pointer(event);
      let dIndex = getDataIndexByX(this.xline, this.yline, xy);
      if (dIndex != null && dIndex < this.chartdata.length) {
        showTooltip.call(this, event, xy, dIndex, this.xline, this.yline);
      } else {
        hideTooltip.call(this);
      }
    })
    .on("mouseleave touchend blur", (event) => {
      hideTooltip.call(this);
    });


  }

