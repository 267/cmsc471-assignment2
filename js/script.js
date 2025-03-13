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

let xVar = "tempAvg";
let yVar = "avgWind";
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
    .text(options[xVar])
    .attr("class", "labels");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .text(options[yVar])
    .attr("class", "labels");

  const colors = (x) => {
    if (x <= 32) return "#0000FF";
    if (x <= 50) return "#90d5ff";
    if (x <= 65) return "#ff8080";
    if (x <= 85) return "#ab2e2e";
    if (x > 85) return "#ff0303";
  };

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
          .style("fill", (d) => colors(d.tempAvg))
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
          .attr("r", 5)
          .style("fill", (d) => colors(d.tempAvg)),
      (exit) => exit.transition(t).attr("r", 0).remove(),
    );
}
