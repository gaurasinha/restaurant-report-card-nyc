var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var groupColors = ['#1a9850', '#91cf60', '#d9ef8b', '#fee08b', '#fc8d59','#d73027' ]
var currentZip;
var selectedZip;

var cuisineDimensions = {
  width: 400,
  height: 600,
  margin: {
    top: 0,
    bottom: 0,
    right: 0,
    left: 10
  }
}

var svgcuisine = d3.select("#cuisinesArea")
  .style("width", cuisineDimensions.width)
  .style("height", cuisineDimensions.height)

var bars;
var svgGroups;

var scaleColor = d3.scaleSequential(d3.interpolateRdYlGn)
  .domain(d3.extent(zipdata.features, d => d.properties.AvgScore > 0 ? d.properties.AvgScore : 2))
function zipColor(d) {
  if (d > 0)
    return scaleColor(d)
  else
    return '#666'
}

var restData;
d3.csv('assets/data/restrauntAvg.csv').then(function (data) {
  // For each row in data, create a marker and add it to the map
  // For each row, columns `Latitude`, `Longitude`, and `Title` are required

  restData = data;

  geojson = L.geoJson(zipdata, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);

  showCuisine('11385')
});


function style(feature) {
  return {
    fillColor: zipColor(feature.properties.AvgScore),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.5
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.5
  });

  layer.bringToFront();
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
}

//Number.prototype.between = function(a, b) {
  function calcRange(a,b){
  var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
    return [min, max]
  //return this > min && this < max;
};


function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
  updateCuisine(e.target.feature.properties.ZIPCODE)
  var geoBounds = e.target.getBounds();

  latRange = calcRange(geoBounds._northEast.lat, geoBounds._southWest.lat)
  lngRange = calcRange(geoBounds._northEast.lng, geoBounds._southWest.lng)

  //filter data falling within geobounds
  filteredData = restData.filter(function(d){ return  (d.Latitude >= latRange[0] && d.Latitude <= latRange[1] && d.Longitude >= lngRange[0] && d.Longitude <= lngRange[1]) })
  console.log(filteredData)
  filteredData.forEach(function (d,i) {

    var marker =L.marker([d.Latitude,d.Longitude], {
      opacity: 1
    }).bindPopup(d.DBA)
    marker.addTo(map)
  })

  console.log(geoBounds)
  //console.log(test.between(geoBounds._northEast.lat, geoBounds._southWest.lat));
  console.log("NorthEast: " + geoBounds._northEast.lat)
  console.log("NorthEast: " + geoBounds._northEast.lng)
  console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

function updateCuisine(zip){
  currentZip = zipCuisneData(zip);
  var cuisinebars = svgcuisine.select('g').selectAll('rect').data(currentZip)
  cuisinebars.exit().remove();
  var cuisineKeys = getCuisineKeys(zip)
  currentZip = zipCuisneData(zip)
  var maxSum = d3.max(currentZip, d => d[2])
  var yScale = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScale = d3.scaleLinear()
    .domain([0, maxSum])
    .range([cuisineDimensions.margin.left, cuisineDimensions.width - cuisineDimensions.margin.right])

    cuisinebars.enter()
      .append("rect")
      .merge(cuisinebars).transition()
      .duration(700)
      .attr("y", d => yScale(d[0]))
      .attr('x', xScale(0))
.attr("fill", (d,i) => groupColors[d[1]])
.attr("height", d => yScale.bandwidth())
.attr("width", d => xScale(d[2]))

}

function zipCuisneData(zip){
  var cuisineGroup = d3.rollup(d3.filter(restData, x => x.ZIPCODE == zip), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(5, parseInt(d.AvgScore / 10)))
  //  d3.rollup(, v => v.length, d => Math.min(5,parseInt(d.AvgScore/5)))
  // console.log(d3.flatRollup(d3.filter(restData, x => x.ZIPCODE == zip), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(5, parseInt(d.AvgScore / 10))))
  var arrayData = []
  cuisineGroup.forEach(function(value, key) {
    sum = 0;
    for (j = 0; j < 6; j++) {
      if (value.get(j) != undefined){
        sum += value.get(j)
        arrayData.push([key,j,sum])}
    }
  })
  return arrayData.reverse()
}

function getCuisineKeys(zip){
  var cuisineGroup = d3.group(d3.filter(restData, x => x.ZIPCODE == zip), d => d['CUISINE DESCRIPTION'])
  return cuisineGroup.keys()
}

function showCuisine(zip) {
  var cuisineKeys = getCuisineKeys(zip)
  currentZip = zipCuisneData(zip)
  var maxSum = d3.max(currentZip, d => d[2])
  var yScale = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScale = d3.scaleLinear()
    .domain([0, maxSum])
    .range([cuisineDimensions.margin.left, cuisineDimensions.width - cuisineDimensions.margin.right])
  svgcuisine.append("g").selectAll("rect")
                        .data(currentZip)
                        .enter()
                        .append("rect")
                        .attr("y", d => yScale(d[0]))
                        .attr('x', xScale(0))
                        .attr("fill", (d,i) => groupColors[d[1]])
                        .attr("height", d => yScale.bandwidth())
                        .attr("width", d => xScale(d[2]))

}
