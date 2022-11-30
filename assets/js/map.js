var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var legendBR = L.control({ position: 'bottomright' });
L.Icon.Default.imagePath = 'images/'

var groupColors = ['#7BB661', '#FEF65C', '#FF5348']
var selectedData;
var selectedZip = [];
var yAxisCBar;
var selectedCuisine = [];
var cuisineKeys;
var circleColor;
var filteredData;

var markerIcon = [new L.Icon.Default({ iconUrl: 'marker-icon-green.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-green-2x.png' }),
new L.Icon.Default({ iconUrl: 'marker-icon-yellow.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-yellow-2x.png' }),
new L.Icon.Default({ iconUrl: 'marker-icon-red.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-red-2x.png' })]

var cuisineDimensions = {
  width: 600,
  height: 320,
  margin: {
    top: 0,
    bottom: 0,
    right: 0,
    left: 75
  }
}



legendBR.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML +=
    '<h4\>Area Average Food Safety</h4\>Unsafe <svg width="70" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg"\><defs\><linearGradient id="Gradient1"\><stop offset="0%" stop-color=' + groupColors[2] + '  stop-opacity="0.75"/\><stop offset="50%" stop-color=' + groupColors[1] + '  stop-opacity="0.75"/\><stop offset="100%" stop-color=' + groupColors[0] + '  stop-opacity="0.75"/\></linearGradient\></defs\><rect x="0" y="0" width="70" height="20" stroke="black" fill="url(#Gradient1)" /\></svg\> Safe';
  return div;
};

legendBR.addTo(map);

var svgcuisine = d3.select("#cuisinesArea")
  .style("width", cuisineDimensions.width)
  .style("height", cuisineDimensions.height)

var bars;
var svgGroups;
var markerLayer;
var circleLayer;

var genCuisine = d3.select("#cuisines")

var scaleColor = d3.scaleLinear()
  .domain([0, 21, 42])
  .range(groupColors)
function zipColor(d) {
  if (d > 0) {
    return scaleColor(Math.min(42, d))
  }
  else
    return '#666'
}

var restData;
var gradeData;
var ViolationCodeData;

d3.csv('assets/data/restrauntAvg.csv').then(function (data) {
  d3.csv('assets/data/ViolationData.csv').then(function (viodata) {
    ViolationCodeData = viodata
    restData = data;

    geojson = L.geoJson(zipdata, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    d3.csv('assets/data/Inspection_Full.csv').then(function (dataGrade) {
      gradeData = dataGrade

      setTimeout(initializeCharts('11378'), 100000);
      map.flyToBounds([
        [40.73551917894102, -73.88564075991255],
        [40.71269707125203, -73.93131508939085]
      ]);
    })
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
function calcRange(a, b) {
  var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
  return [min, max]
  //return this > min && this < max;
};

function displayRestaurantInfo() {
  var popup = document.getElementById("myPopup");
  popup.classList.toggle("show");
}

function clickFeature(e) {
  var markerList = []
  map.fitBounds(e.target.getBounds());
  if (selectedZip.includes(e.target.feature.properties.ZIPCODE)) {
    for (var i = 0; i < selectedZip.length; i++) {
      if (selectedZip[i] === e.target.feature.properties.ZIPCODE)
        selectedZip.splice(i, 1);
    }
  }
  else
    selectedZip.push(e.target.feature.properties.ZIPCODE)

  updateCuisine()
  //filter data falling with clicked zipcode
  filteredData = restData.filter(d => selectedZip.includes(d.ZIPCODE))

  var tmpCuisine = []
  selectedCuisine.forEach(function (d) {
    if (cuisineKeys.includes(d))
      tmpCuisine.push(d)
  })
  selectedCuisine = tmpCuisine
  circleCuisine()
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(e => d.CAMIS == e.CAMIS)
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // }
    // )

    //var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">' + d.DBA + '</span><br>' + d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET + '<svg id="chart"></svg></div>')[0];

    var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;"><div class="popup" onclick="displayRestaurantInfo()">' + d.DBA +'<span class="popuptext" id="myPopup">'+ 'Cuisine: '+ d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET +'</span></div>' +'<svg id="chart"></svg></div>')[0];
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
      .domain(["C", "B", "A"])
      .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.bottom])

    var xScale = d3.scaleBand()
      .domain(inspectData.map(xAccessor))
      .range([dimensions.margin.left, dimensions.width - dimensions.margin.left])
      .padding(0.5)

    var fillColor = d3.scaleOrdinal()
      .domain(["A", "B", "C"])
      .range(groupColors)

    var dots = svg.append("g")
      .selectAll("circle")
      .data(inspectData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", d => fillColor(yAccessor(d)))

    svg.append("path")
      .datum(inspectData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => xScale(xAccessor(d)))
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

    var marker = L.marker([d.Latitude, d.Longitude], {
      opacity: 1,
      icon: markerIcon[Math.min(2, parseInt(d.AvgScore / 14))]
    }).bindPopup(popup)
    markerList.push(marker)
  }
  )
  markerLayer.clearLayers();
  markerLayer = L.layerGroup(markerList).addTo(map);
  UpdatedviolationsInSelectedArea();
  // not sure what does these lines do but it is giving error so I'll comment them for now
  // if (d.DBA) {

  //   var svg = d3.select(div).select("svg").attr("width", 200).attr("height", 200);
  //   svg.append("rect").attr("width", 150).attr("height", 150).style("fill", "lightBlue");
  // }

}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: clickFeature
  });
}

function updateCuisine() {
  selectedData = updateSelectedData();
  cuisineKeys = getCuisineKeys(selectedData)
  circleColor = d3.scaleOrdinal()
    .domain(cuisineKeys)
    .range(d3.schemeCategory10)
  topData = d3.filter(selectedData, d => cuisineKeys.includes(d[0]))
  var cuisinebars = svgcuisine.select('g').selectAll('rect').data(topData)
  cuisinebars.exit().remove();
  var cuisineCountLabels = svgcuisine.select('#countLabel').selectAll('text').data(topData.filter(d => d[1] == 2))
  cuisineCountLabels.exit().remove();
  var maxSum = d3.max(selectedData, d => d[3])
  var yScaleCBar = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScaleCBar = d3.scaleLinear()
    .domain([0, maxSum])
    .range([cuisineDimensions.margin.left, cuisineDimensions.width - cuisineDimensions.margin.right - cuisineDimensions.margin.left])

  cuisinebars.enter()
    .append("rect")
    .merge(cuisinebars).transition()
    .duration(700)
    .attr("y", d => yScaleCBar(d[0]))
    .attr('x', d => xScaleCBar(d[2]))
    .attr("fill", d => groupColors[d[1]])
    .attr("height", yScaleCBar.bandwidth())
    .attr("width", d => xScaleCBar(d[3]) - xScaleCBar(d[2]))
  cuisineCountLabels.enter().append("text")
    .merge(cuisineCountLabels).transition()
    .duration(700)
    .text(d => d[3])
    .attr('y', d => yScaleCBar(d[0]) + yScaleCBar.bandwidth() * .7)
    .attr('x', d => xScaleCBar(d[3]) + 3)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
  var yAxisgenCBar = d3.axisLeft(yScaleCBar)
    .tickSize(0);
  yAxisCBar.merge(yAxisCBar).transition().duration(700).call(yAxisgenCBar)
  yAxisCBar.selectAll('.tick').selectAll('text').merge(yAxisCBar).transition().duration(700).style('fill', function (d) {
    if (selectedCuisine.includes(d))
      return circleColor(d)
    return "currentColor"
  })
    .style('font-weight', function (d) {
      if (selectedCuisine.includes(d))
        return 'bold'
      return "normal"
    })
  yAxisCBar.selectAll('.tick').selectAll('text').on('click', clickCuisineName)
}

function updateSelectedData() {
  var cuisineGroup = d3.rollup(d3.filter(restData, x => selectedZip.includes(x.ZIPCODE)), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(2, parseInt(d.AvgScore / 14)))
  //  d3.rollup(, v => v.length, d => Math.min(5,parseInt(d.AvgScore/5)))
  // console.log(d3.flatRollup(d3.filter(restData, x => x.ZIPCODE == zip), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(5, parseInt(d.AvgScore / 10))))
  var arrayData = []
  cuisineGroup.forEach(function (value, key) {
    sum = 0;
    for (j = 0; j < 3; j++) {
      if (value.get(j) != undefined) {
        arrayData.push([key, j, sum, sum + value.get(j)])
        sum += value.get(j)
      }
      else {
        arrayData.push([key, j, sum, sum])
      }
    }
  })
  arrayData.sort((a, b) => b[3] - a[3])
  return arrayData
}

function getCuisineKeys(selectedData) {
  var cuisineNames = new Set(selectedData.map(d => d[0]))
  return Array.from(cuisineNames).slice(0, 10)
}

function clickCuisineName(e) {
  var cuisineName = e.target.innerHTML
  if (selectedCuisine.includes(cuisineName)) {
    for (var i = 0; i < selectedCuisine.length; i++) {
      if (selectedCuisine[i] === cuisineName)
        selectedCuisine.splice(i, 1);
    }
  }
  else {
    selectedCuisine.push(cuisineName)
  }
  yAxisCBar.selectAll('.tick').selectAll('text').style('fill', function (d) {
    if (selectedCuisine.includes(d))
      return circleColor(d)
    return "currentColor"
  })
    .style('font-weight', function (d) {
      if (selectedCuisine.includes(d))
        return 'bold'
      return "normal"
    })
  circleCuisine()
}

function initializeCharts(zip) {
  selectedZip.push(zip)
  selectedCuisine.push('American')
  var markerList = [];
  selectedData = updateSelectedData()
  cuisineKeys = getCuisineKeys(selectedData)
  circleColor = d3.scaleOrdinal()
    .domain(cuisineKeys)
    .range(d3.schemeCategory10)
  selectedData = d3.filter(selectedData, d => cuisineKeys.includes(d[0]))
  var maxSum = d3.max(selectedData, d => d[3])
  var yScaleCBar = d3.scaleBand()
    .domain(cuisineKeys)
    .range([cuisineDimensions.margin.top, cuisineDimensions.height - cuisineDimensions.margin.bottom])
    .padding([0.2])
  var xScaleCBar = d3.scaleLinear()
    .domain([0, maxSum])
    .range([cuisineDimensions.margin.left, cuisineDimensions.width - cuisineDimensions.margin.right - cuisineDimensions.margin.left])
  var yAxisgenCBar = d3.axisLeft()
    .scale(yScaleCBar)
    .tickSize(0)
  svgcuisine.append("g").selectAll("rect")
    .data(selectedData)
    .enter()
    .append("rect")
    .attr("y", d => yScaleCBar(d[0]))
    .attr('x', d => xScaleCBar(d[2]))
    .attr("fill", d => groupColors[d[1]])
    .attr("height", yScaleCBar.bandwidth())
    .attr("width", d => xScaleCBar(d[3]) - xScaleCBar(d[2]))
  svgcuisine.append("g")
    .attr('id', 'countLabel')
    .selectAll("text")
    .data(selectedData.filter(d => d[1] == 2))
    .enter().append("text")
    .text(d => d[3])
    .attr('y', d => yScaleCBar(d[0]) + yScaleCBar.bandwidth() * .7)
    .attr('x', d => xScaleCBar(d[3]) + 3)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
  yAxisCBar = svgcuisine.append("g")
    .attr("transform", `translate(${cuisineDimensions.margin.left}, 0)`)
    .call(yAxisgenCBar)
    .style('stroke', 'white')
    .style('stroke-width', '3')
    .style('paint-order', 'stroke')
    .style("stroke-linecap", 'butt')
    .style('stroke-linejoin', 'miter')
  yAxisCBar.selectAll('path').style('display', 'none')
  yAxisCBar.selectAll('.tick').selectAll('text').style('fill', function (d) {
    if (selectedCuisine.includes(d))
      return circleColor(d)
    return "currentColor"
  })
    .style('font-weight', function (d) {
      if (selectedCuisine.includes(d))
        return 'bold'
      return "normal"
    })
    .on('click', clickCuisineName)
  filteredData = restData.filter(d => selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(e => d.CAMIS == e.CAMIS)
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // })
    // var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:200px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><p>'+inspectionResult+'</p><svg id="chart"></svg></div>')[0];

   // var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">' + d.DBA + '</span><br>' + d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET + '<svg id="chart"></svg></div>')[0];
    var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;"><div class="popup" onclick="displayRestaurantInfo()">' + d.DBA +'<span class="popuptext" id="myPopup">'+ 'Cuisine: '+ d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET +'</span></div>' +'<svg id="chart"></svg></div>')[0];

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
      .domain(["C", "B", "A"])
      .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.bottom])

    var xScale = d3.scaleBand()
      .domain(inspectData.map(xAccessor))
      .range([dimensions.margin.left, dimensions.width - dimensions.margin.left])
      .padding(0.5)

    var fillColor = d3.scaleOrdinal()
      .domain(["A", "B", "C"])
      .range(groupColors)

    var dots = svg.append("g")
      .selectAll("circle")
      .data(inspectData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", d => fillColor(yAccessor(d)))

    svg.append("path")
      .datum(inspectData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => xScale(xAccessor(d)))
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
    marker = L.marker([d.Latitude, d.Longitude], {
      opacity: 1,
      icon: markerIcon[Math.min(2, parseInt(d.AvgScore / 14))]
    }).bindPopup(popup)
    markerList.push(marker)
  })
  markerLayer = L.layerGroup(markerList).addTo(map)
  drawLegendCuisine()
  violationsInSelectedArea();
  circleCuisine()
}

function drawLegendCuisine() {
  var lcDimensions = {
    width: 200,
    height: 60
  }
  svgcuisine.append("g")
    .attr('id', 'cuisineLegend')
    .attr('transform', 'translate(' + (cuisineDimensions.width - lcDimensions.width) + ', ' + (cuisineDimensions.height - lcDimensions.height) + ')')
    .append('rect')
    .attr("width", lcDimensions.width)
    .attr("height", lcDimensions.height)
    .attr("x", 0)
    .attr("y", 0)
    .attr('fill', 'white')
    .attr('stroke', 'black')
  var legen = svgcuisine.select('#cuisineLegend')
  legen.append('text')
    .text('Restraunt Count')
    .attr('text-anchor', 'middle')
    .attr('y', 20)
    .attr('x', lcDimensions.width / 2)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
  var legenXScale = d3.scaleBand()
    .domain(['A', 'B', 'C'])
    .range([0, lcDimensions.width])
    .padding([0.2])
  legen.append('rect')
    .attr('y', 30)
    .attr('x', legenXScale('A'))
    .attr('width', 16)
    .attr('height', 16)
    .attr('fill', groupColors[0])
  legen.append('rect')
    .attr('y', 30)
    .attr('x', legenXScale('B'))
    .attr('width', 16)
    .attr('height', 16)
    .attr('fill', groupColors[1])
  legen.append('rect')
    .attr('y', 30)
    .attr('x', legenXScale('C'))
    .attr('width', 16)
    .attr('height', 16)
    .attr('fill', groupColors[2])
  legen.append('text')
    .text('Grade A')
    .attr('y', 43)
    .attr('x', legenXScale('A') + 18)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
  legen.append('text')
    .text('Grade B')
    .attr('y', 43)
    .attr('x', legenXScale('B') + 18)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
  legen.append('text')
    .text('Grade C')
    .attr('y', 43)
    .attr('x', legenXScale('C') + 18)
    .attr('font-size', 10)
    .attr('font-family', "sans-serif")
}

function circleCuisine() {
  if (circleLayer != undefined) {
    circleLayer.clearLayers();
  }
  var circleList = [];
  selectedCuisineData = filteredData.filter(d => selectedCuisine.includes(d['CUISINE DESCRIPTION']))
  selectedCuisineData.forEach(function (d) {
    var circleRest = L.circleMarker([d.Latitude, d.Longitude], {
      color: circleColor(d['CUISINE DESCRIPTION']),
      fill: false,
      weight: 4,
      pane: 'shadowPane',
      radius: 7
    })
    circleList.push(circleRest)
  })
  circleLayer = L.layerGroup(circleList).addTo(map)
}

var margin = { top: 30, right: 30, bottom: 70, left: 60 },
  width = 660 - margin.left - margin.right,
  height = 320 - margin.top - margin.bottom;

var violationSvg = d3.select("#violation")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

function violationsInSelectedArea() {
  // var svgarea = d3.select("violation");
  // svgarea.selectAll("*").remove();

  // violation data 
  // filteredViolationData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredViolationData = ViolationCodeData.filter(d => selectedZip.includes(d.ZIPCODE))
  // filteredData.forEach(function (d) {
  //   VCData = ViolationCodeData.filter(e => d.CAMIS==e.CAMIS)

  // VCData = ViolationCodeData.filter(function (e){return (d.Latitude==e.Latitude) && (d.Longitude==e.Longitude)})
  // })
  console.log(filteredViolationData);
  var VGroup = d3.rollup(filteredViolationData, v => v.length, d => d['VIOLATIONCODE'])
  console.log(VGroup);
  const sortedVDesc = new Map([...VGroup].sort((a, b) => b[1] - a[1]));
  console.log(sortedVDesc);
  arrayTmp = Array.from(sortedVDesc).slice(0, 10)
  myMap = new Map(arrayTmp)
  console.log(myMap)
  arrayDatas = [];
  myMap.forEach(function (value, key) {

    arrayDatas.push(key)

  })

  console.log(arrayDatas);
  var maxvalue = arrayTmp[0][1];

  // X axis
  var x = d3.scaleBand()
    .range([0, width])
    .domain(arrayDatas)
    .padding(0.1);
  violationSvg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end");

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, maxvalue])
    .range([height, 0]);
  violationSvg.append("g")
    .call(d3.axisLeft(y));

  // Bars
  violationSvg.selectAll("mybar")
    .data(arrayTmp)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d[1]); })
    .attr("fill", "#69b3a2")
}
function UpdatedviolationsInSelectedArea() {
  violationSvg.selectAll("*").remove();
  // violation data 
  // filteredViolationData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredViolationData = ViolationCodeData.filter(d => selectedZip.includes(d.ZIPCODE))
  // filteredData.forEach(function (d) {
  //   VCData = ViolationCodeData.filter(e => d.CAMIS==e.CAMIS)

  // VCData = ViolationCodeData.filter(function (e){return (d.Latitude==e.Latitude) && (d.Longitude==e.Longitude)})
  // })
  console.log(filteredViolationData);
  var VGroup = d3.rollup(filteredViolationData, v => v.length, d => d['VIOLATIONCODE'])
  console.log(VGroup);
  const sortedVDesc = new Map([...VGroup].sort((a, b) => b[1] - a[1]));
  console.log(sortedVDesc);
  UarrayTmp = Array.from(sortedVDesc).slice(0, 10)
  myMap = new Map(UarrayTmp)
  console.log(myMap)

  // var violationbar = violationSvg.select('g').selectAll('rect').data(UarrayTmp)
  // violationbar.exit().remove();
  arrayDatas = [];
  myMap.forEach(function (value, key) {

    arrayDatas.push(key)

  })

  console.log(arrayDatas);
  var maxvalue = UarrayTmp[0][1];


  // const svgContainer = d3.select('#container');
  // set the dimensions and margins of the graph

  // append the svg object to the body of the page


  // Parse the Data

  // X axis
  var x = d3.scaleBand()
    .range([0, width])
    .domain(arrayDatas)
    .padding(0.1);
  violationSvg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end");

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, maxvalue])
    .range([height, 0]);
  violationSvg.append("g")
    .call(d3.axisLeft(y));

  // Bars
  violationSvg.selectAll("mybar")
    .data(UarrayTmp)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d[1]); })
    .attr("fill", "#69b3a2")
}


