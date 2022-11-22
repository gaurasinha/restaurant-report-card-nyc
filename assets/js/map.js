var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var legendBR = L.control({position: 'bottomright'});
L.Icon.Default.imagePath = 'images/'

var groupColors = ['#7BB661', '#FEF65C', '#FF5348' ]
var selectedData;
var selectedZip = [];
var selectedCuisineGrade = [];
var yAxisCBar;

var markerIcon = [new L.Icon.Default({iconUrl:'marker-icon-green.png',shadowUrl:'marker-shadow.png',iconRetinaUrl:'marker-icon-green-2x.png'}),
new L.Icon.Default({iconUrl:'marker-icon-yellow.png',shadowUrl:'marker-shadow.png',iconRetinaUrl:'marker-icon-yellow-2x.png'}),
new L.Icon.Default({iconUrl:'marker-icon-red.png',shadowUrl:'marker-shadow.png',iconRetinaUrl:'marker-icon-red-2x.png'})]

var cuisineDimensions = {
  width: 400,
  height: 600,
  margin: {
    top: 0,
    bottom: 0,
    right: 0,
    left: 30
  }
}


legendBR.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML +=
          '<h4\>Area Average Food Safety</h4\>Unsafe <svg width="70" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg"\><defs\><linearGradient id="Gradient1"\><stop offset="0%" stop-color='+groupColors[2]+'  stop-opacity="0.75"/\><stop offset="50%" stop-color='+groupColors[1]+'  stop-opacity="0.75"/\><stop offset="100%" stop-color='+groupColors[0]+'  stop-opacity="0.75"/\></linearGradient\></defs\><rect x="0" y="0" width="70" height="20" stroke="black" fill="url(#Gradient1)" /\></svg\> Safe';
  return div;
};

legendBR.addTo(map);

var svgcuisine = d3.select("#cuisinesArea")
  .style("width", cuisineDimensions.width)
  .style("height", cuisineDimensions.height)

var bars;
var svgGroups;
var markerLayer;

var genCuisine = d3.select("#cuisines")

var scaleColor = d3.scaleLinear()
  .domain([0,21,42])
  .range(groupColors)
function zipColor(d) {
  if (d > 0){
    return scaleColor(Math.min(42,d))
  }
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
    setTimeout(showCuisine('11378'), 1000);
    map.flyToBounds([
      [40.73551917894102, -73.88564075991255],
      [40.71269707125203, -73.93131508939085]
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
    fillOpacity: 0.75
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.4
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
  if(selectedZip.includes(e.target.feature.properties.ZIPCODE)){
    for (var i = 0; i < selectedZip.length; i++) {
      if (selectedZip[i] === e.target.feature.properties.ZIPCODE) 
          selectedZip.splice(i, 1);
      }
  }
  else
    selectedZip.push(e.target.feature.properties.ZIPCODE)

  updateCuisine()
  //filter data falling with clicked zipcode
  filteredData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(function (e){return (d.Latitude==e.Latitude)&&(d.DBA==e.DBA)})
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // }
    // )

  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:170px;"><span style="font-weight: bold;color:darkorange">Food Grades: 2021-22</span><br><span style="font-weight: bold;color: black;">'+d.DBA+'</span><svg id="chart"></svg></div>')[0];


  var xAccessor = d => d.INSPECTION_DATE
  var yAccessor = d => d.GRADE 

      var dimensions = {
        width: 200,
        height: 130,
        margin: {
          top: 10, right: 10, bottom: 45, left: 20
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
              .domain(["A","B","C"])
              .range(groupColors)

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
                    //.text("")
                    .attr("transform", "rotate(-35)")

     var yAxis = svg.append("g")
                    .call(yAxisgen)
                    .style("transform", `translateX(${dimensions.margin.left}px)`)

    var popup = L.popup().setContent(div);

    var marker =L.marker([d.Latitude,d.Longitude], {
      opacity: 1,
      icon: markerIcon[Math.min(2, parseInt(d.AvgScore / 14))]
    }).bindPopup(popup)
    markerList.push(marker)
  }
  )
  markerLayer.clearLayers();
  markerLayer = L.layerGroup(markerList).addTo(map);

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

function updateCuisine(){
  selectedData = updateSelectedData();
  var cuisineKeys = getCuisineKeys(selectedData)
  topData = d3.filter(selectedData, d => cuisineKeys.includes(d[0]))
  var cuisinebars = svgcuisine.select('g').selectAll('rect').data(topData)
  cuisinebars.exit().remove();
  var maxSum = d3.max(selectedData, d => d[2])
  var yScaleCBar = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScaleCBar = d3.scaleLinear()
    .domain([0, maxSum])
    .range([0, cuisineDimensions.width - cuisineDimensions.margin.right-cuisineDimensions.margin.left])

  cuisinebars.enter()
      .append("rect")
      .merge(cuisinebars).transition()
      .duration(700)
      .attr("y", d => yScaleCBar(d[0]))
      .attr('x', cuisineDimensions.margin.left)
      .attr("fill", d => groupColors[d[1]])
      .attr("height", yScaleCBar.bandwidth())
      .attr("width", d => xScaleCBar(d[2]))
  var yAxisgenCBar = d3.axisLeft(yScaleCBar)
                       .tickSize(0);
  yAxisCBar.merge(yAxisCBar).transition().duration(700).call(yAxisgenCBar)

}

function updateSelectedData(){
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
  arrayData.sort((a, b) => b[2] - a[2])
  return arrayData
}

function getCuisineKeys(selectedData){
  var cuisineNames = new Set(selectedData.map(d=>d[0]))
  return Array.from (cuisineNames).slice(0,20)
}

function showCuisine(zip) {
  selectedZip.push(zip)
  var markerList = [];
  selectedData = updateSelectedData()
  var cuisineKeys = getCuisineKeys(selectedData)
  selectedData = d3.filter(selectedData, d => cuisineKeys.includes(d[0]))
  var maxSum = d3.max(selectedData, d => d[2])
  var yScaleCBar = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScaleCBar = d3.scaleLinear()
    .domain([0, maxSum])
    .range([0, cuisineDimensions.width - cuisineDimensions.margin.right - cuisineDimensions.margin.left])
  var yAxisgenCBar = d3.axisLeft()
                       .scale(yScaleCBar)
                       .tickSize(0)
  svgcuisine.append("g").selectAll("rect")
                        .data(selectedData)
                        .enter()
                        .append("rect")
                        .attr("y", d => yScaleCBar(d[0]))
                        .attr('x', cuisineDimensions.margin.left)
                        .attr("fill", (d,i) => groupColors[d[1]])
                        .attr("height", d => yScaleCBar.bandwidth())
                        .attr("width", d => xScaleCBar(d[2]))
  yAxisCBar = svgcuisine.append("g")
                    .call(yAxisgenCBar)
                    .style("text-anchor","start")
                    .style('stroke','white')
                    .style('stroke-width','3')
                    .style('paint-order','stroke')
                    .style("transform", `translateX(3px)`)
                    .style("stroke-linecap", 'butt')
                    .style('stroke-linejoin', 'miter')
  yAxisCBar.selectAll('path').style('display','none')
  filteredData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
  inspectData = gradeData.filter(function (e){return d.CAMIS==e.CAMIS})
  // var inspectionResult = ""
  // inspectData.forEach(function (e){
  //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
  // })
  // var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:200px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><p>'+inspectionResult+'</p><svg id="chart"></svg></div>')[0];
  
  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:170px;"><span style="font-weight: bold;color:darkorange">Food Grades: 2021-22</span><br><span style="font-weight: bold;color: black;">'+d.DBA+'</span><svg id="chart"></svg></div>')[0];


  var xAccessor = d => d.INSPECTION_DATE
  var yAccessor = d => d.GRADE 

      var dimensions = {
        width: 200,
        height: 130,
        margin: {
          top: 10, right: 10, bottom: 45, left: 20
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
              .domain(["A","B","C"])
              .range(groupColors)

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
                    //.text("")
                    .attr("transform", "rotate(-35)")

     var yAxis = svg.append("g")
                    .call(yAxisgen)
                    .style("transform", `translateX(${dimensions.margin.left}px)`)

  var popup = L.popup().setContent(div);
  marker =L.marker([d.Latitude,d.Longitude], {
    opacity: 1,
    icon: markerIcon[Math.min(2, parseInt(d.AvgScore / 14))]
  }).bindPopup(popup)
  markerList.push(marker)
})
markerLayer = L.layerGroup(markerList).addTo(map)
}
