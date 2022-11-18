var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var groupColors = ['#7BB661', '#FEF65C', '#FF5348' ]
var currentZip;
var selectedZip = [];

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
var markerList = [];

var genCuisine = d3.select("#cuisines")

var scaleColor = d3.scaleSequential(d3.interpolateRdYlGn)
  .domain(d3.extent(zipdata.features, d => d.properties.AvgScore > 0 ? -d.properties.AvgScore : -2))
function zipColor(d) {
  if (d > 0)
    return scaleColor(-d)
  else
    return '#666'
}

var restData;
var gradeData;
d3.csv('assets/data/restrauntAvg.csv').then(function (data) {

  restData = data;

  geojson = L.geoJson(zipdata, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);
  d3.csv('assets/data/Restaurant_Grades_converted.csv').then(function(dataGrade){

    gradeData = dataGrade
    setTimeout(showCuisine('11385'), 1000);
    map.flyToBounds([
      [40.714007978569455, -73.83696277938968],
      [40.682367054019416, -73.9240401141906]
  ]);
  })
});




function style(feature) {
  return {
    fillColor: zipColor(feature.properties.AvgScore),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.6
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.6
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
  var markerList = []
  map.fitBounds(e.target.getBounds());
  updateCuisine(e.target.feature.properties.ZIPCODE)
  if(selectedZip.includes(e.target.feature.properties.ZIPCODE)){
    for (var i = 0; i < selectedZip.length; i++) {
      if (selectedZip[i] === e.target.feature.properties.ZIPCODE) 
          selectedZip.splice(i, 1);
      }
  }
  else
    selectedZip.push(e.target.feature.properties.ZIPCODE)

  //filter data falling with clicked zipcode
  filteredData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(function (e){return (d.Latitude==e.Latitude)&&(d.DBA==e.DBA)})
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // }
    // )

  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:250px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><svg id="chart"></svg></div>')[0];


  var xAccessor = d => d.INSPECTION_DATE
  var yAccessor = d => d.GRADE 

      var dimensions = {
        width: 200,
        height: 130,
        margin: {
          top: 10, right: 10, bottom: 40, left: 20
        }
      }
                    
    
    var svg = d3.select(div).select("#chart")
                .style("width", dimensions.width)
                .style("height", dimensions.height)
    var yScale = d3.scaleBand()
                    .domain(["C","B","A"])
                    .range([dimensions.height-dimensions.margin.bottom,dimensions.margin.bottom])

    var xScale = d3.scaleBand()
                    .domain(inspectData.map(xAccessor))
                    .range([dimensions.margin.left, dimensions.width - dimensions.margin.left])
                    .padding(0.5)

     var fillColor = d3.scaleOrdinal()
              .domain(["C","B","A"])
              .range(["red","yellow","green"])

     var dots = svg.append("g")
                      .selectAll("circle")
                      .data(inspectData)
                      .enter()
                      .append("circle")
                      .attr("cx", d => xScale(xAccessor(d)))
                      .attr("cy", d => yScale(yAccessor(d)))
                      .attr("r", 5)
                      .attr("fill", d=>fillColor(yAccessor(d)))

      svg.append("path")
      .datum(inspectData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d=>xScale(xAccessor(d)))
        .y(d => yScale(yAccessor(d)))
        )

     var xAxisgen = d3.axisBottom().scale(xScale)
     var yAxisgen = d3.axisLeft().scale(yScale)

     var xAxis = svg.append("g")
                    .call(xAxisgen)
                    .style("transform", `translateY(${dimensions.height - dimensions.margin.bottom}px)`)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .text("")
                    .attr("transform", "rotate(-45)")
                    
     var yAxis = svg.append("g")
                    .call(yAxisgen)
                    .style("transform", `translateX(${dimensions.margin.left}px)`)

    var popup = L.popup().setContent(div);

    var marker =L.marker([d.Latitude,d.Longitude], {
      opacity: 1
    }).bindPopup(popup)
    markerList.push(marker)
  }
  )
  
  var markerLayer = L.layerGroup(markerList);
  if (map.hasLayer(markerLayer)){
    markerLayer.clearLayers();
    map.removeLayer(markerLayer);
  }
  else{
    map.addLayer(markerLayer);
  }
  if (d.DBA) {

            var svg = d3.select(div).select("svg").attr("width", 200).attr("height", 200);
            svg.append("rect").attr("width", 150).attr("height", 150).style("fill", "lightBlue");       
    }
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
  var cuisineGroup = d3.rollup(d3.filter(restData, x =>selectedZip.includes(x.ZIPCODE)), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(2, parseInt(d.AvgScore / 14)))
  //  d3.rollup(, v => v.length, d => Math.min(5,parseInt(d.AvgScore/5)))
  // console.log(d3.flatRollup(d3.filter(restData, x => x.ZIPCODE == zip), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(5, parseInt(d.AvgScore / 10))))
  var arrayData = []
  cuisineGroup.forEach(function(value, key) {
    sum = 0;
    for (j = 0; j < 3; j++) {
      if (value.get(j) != undefined){
        sum += value.get(j)
        arrayData.push([key,j,sum])}
    }
  })
  return arrayData.reverse()
}

function getCuisineKeys(zip){
  var cuisineGroup = d3.group(d3.filter(restData, x => selectedZip.includes(x.ZIPCODE)), d => d['CUISINE DESCRIPTION'])
  return cuisineGroup.keys()
}

function showCuisine(zip) {
  selectedZip.push(zip)
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
  filteredData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(function (e){return (d.Latitude==e.Latitude)&&(d.DBA==e.DBA)})
  var inspectionResult = ""
  inspectData.forEach(function (e){
    inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
  })
  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:200px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><p>'+inspectionResult+'</p><svg id="chart"></svg></div>')[0];
  var popup = L.popup().setContent(div);
  marker =L.marker([d.Latitude,d.Longitude], {
    opacity: 1
  }).bindPopup(popup)
  marker.addTo(map)
})
}
