const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3
  .select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const data = await d3.csv("weather.csv", (d) => ({
  station: d.station,
  state: d.state,
  latitude: parseFloat(d.latitude),
  longitude: parseFloat(d.longitude),
  elevation: parseFloat(d.elevation),
  date: parseFloat(d.date),
  tempMin: parseFloat(d.TMIN),
  tempMax: parseFloat(d.TMAX),
  tempAvg: parseFloat(d.TAVG),
  avgWind: parseFloat(d.AWND),
  snow: parseFloat(d.SNOW),
  precipitation: parseFloat(d.PRCP),
}));

let xVar = "tempMin";
let yVar = "tempMax";
let state = "MD";
let xScale;
let yScale;

const options = {
  latitude: "Latitude",
  longitude: "Longitude",
  elevation: "Elevation",
  tempMin: "Minimum Temperature",
  tempMax: "Maximum Temperature",
  tempAvg: "Average Temperature",
  avgWind: "Average Wind",
  snow: "Snow",
  precipitation: "Precipitation",
};

const parseDate = d3.timeParse("%Y%m%d");

data.forEach((d) => {
  const parsedDate = parseDate(d.date);
  d.month = parsedDate.getMonth() + 1;
});

console.log(data.map((d) => d.month));

let slider = d3
  .sliderHorizontal()
  .min(d3.min(data, (d) => +d.year))
  .max(d3.max(data, (d) => +d.year))
  .step(1)
  .width(width)
  .displayValue(true)
  .default(1)
  .on("onchange", (val) => {
    targetYear = +val;
    update(); // nothing yet
  });
d3.select("#slider")
  .append("svg")
  .attr("width", width)
  .attr("height", 70)
  .append("g")
  .attr("transform", "translate(20, 20)")
  .call(slider);

d3.selectAll(".variable")
  .each(function () {
    d3.select(this)
      .selectAll("myOptions")
      .data(Object.keys(options))
      .enter()
      .append("option")
      .text((d) => options[d])
      .attr("value", (d) => d);
  })
  .on("change", function () {
    switch (d3.select(this).property("id")) {
      case "xVariable":
        xVar = d3.select(this).property("value");
        break;
      case "yVariable":
        yVar = d3.select(this).property("value");
        break;
      case "stateVariable":
        state = d3.select(this).property("value");
        break;
    }
    update();
  });
d3.select("#xVariable").property("value", xVar);
d3.select("#yVariable").property("value", yVar);
d3.select("#stateVariable").property("value", state);
update();

function update() {
  const t = 1000;
  const currentData = data.filter(
    (d) => d.state == state && !isNaN(d[xVar]) && !isNaN(d[yVar]),
  );

  svg.selectAll(".axis").remove();
  svg.selectAll(".labels").remove();

  xScale = d3
    .scaleLinear()
    .domain([
      Math.min(
        0,
        d3.min(currentData, (d) => d[xVar]),
      ),
      d3.max(currentData, (d) => d[xVar]),
    ])
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale);
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  yScale = d3
    .scaleLinear()
    .domain([
      Math.min(
        0,
        d3.min(currentData, (d) => d[yVar]),
      ),
      d3.max(currentData, (d) => d[yVar]),
    ])
    .range([height, 0]);
  const yAxis = d3.axisLeft(yScale);
  svg.append("g").attr("class", "axis").call(yAxis);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text(xVar)
    .attr("class", "labels");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .text(yVar)
    .attr("class", "labels");

  svg
    .selectAll(".points")
    .data(currentData, (d) => d)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "points")
          .attr("cx", (d) => xScale(d[xVar]))
          .attr("cy", (d) => yScale(d[yVar]))
          .style("fill", "#61afef")
          .style("opacity", 0.5)
          .style("stroke", "black")
          .style("stroke-width", "0")
          .on("mouseover", function (event, d) {
            d3.select("#tooltip")
              .style("display", "block")
              .html(
                `<strong>Weather station: ${d.station}</strong><br/>
                 Average wind speed: ${d.avgWind}<br>
                 Latitude: ${d.latitude} <br>
                 Longitude: ${d.longitude} <br>
                 Elevation: ${d.elevation} <br>
                 Minimum temperature: ${d.tempMin} <br>
                 Maximum temperature: ${d.tempMax} <br>
                 Average temperature: ${d.tempAvg} <br>
                 Snow: ${d.snow} <br>
                 Precipitation: ${d.precipitation}`,
              )
              .style("left", event.pageX + 20 + "px")
              .style("top", event.pageY - 28 + "px");
            d3.select(this)
              .style("strong", "black")
              .style("stroke-width", "4px");
          })
          .on("mouseout", function (event, d) {
            d3.select("#tooltip").style("display", "none");
            d3.select(this).style("stroke", "none");
          })
          .attr("r", 0)
          .transition(t)
          .attr("r", 5),
      (update) =>
        update
          .transition(t)
          .attr("cx", (d) => xScale(d[xVar]))
          .attr("cy", (d) => yScale(d[yVar]))
          .attr("r", 5),
      (exit) => exit.transition(t).attr("r", 0).remove(),
    );
}
