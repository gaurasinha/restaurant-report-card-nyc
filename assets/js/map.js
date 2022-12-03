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
  selectedCuisine.push('Chinese')
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
    .style('cursor','pointer')
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

var a = {
    "02A" : "Food not cooked to required minimum temperature.",
    "02B": "Hot food item not held at or above 140º F.",
    "02C": "Hot food item that has been cooked and refrigerated is being held for service without first being reheated to 165º F or above within 2 hours.",
    "02D": "Precooked potentially hazardous food from commercial food processing establishment that is supposed to be heated, but is not heated to 140º F within 2 hours.",
    "02F": "Meat, fish or molluscan shellfish served raw or undercooked without prior notification to customer.",
    "02G": "Cold food item held above 41º F (smoked fish and reduced oxygen packaged foods above 38 ºF) except during necessary preparation.",
    "02H": "Food not cooled by an approved method whereby the internal product temperature is reduced from 140º F to 70º F or less within 2  hours, and from 70º F to 41º F or less within 4 additional hours.",
    "02I": "Food prepared from ingredients at ambient temperature not cooled to 41º F or below within 4 hours.",
    "03A": "Food from unapproved or unknown source or home canned. Reduced oxygen packaged (ROP) fish not frozen before processing; or ROP foods prepared on premises transported to another site.",
    "03B": "Shellfish not from approved source, improperly tagged/labeled; tags not retained for 90 days.",
    "03C": "Eggs found dirty/cracked; liquid, frozen or powdered eggs not pasteurized.",
    "03D": "Canned food product observed swollen, leaking or rusted, and not segregated from other consumable food items.",
    "03E": "Potable water supply inadequate. Water or ice not potable or from unapproved source. Cross connection in potable water supply system observed.",
    "03G": "Raw food not properly washed prior to serving.",
    "03I": "Juice packaged on premises with no or incomplete label, no warning statement",
    "04A": "Food Protection Certificate not held by supervisor of food operations.",
    "04B": "Food worker prepares food or handles utensil when ill with a disease transmissible by food, or have exposed infected cut or burn on hand.",
    "04C": "Food worker/food vendor does not use utensil or other barrier to eliminate bare hand contact with food that will not receive adequate additional heat treatment.",
    "04D": "Food worker does not wash hands thoroughly after using the toilet, coughing, sneezing, smoking, eating, preparing raw foods or otherwise contaminating hands.",
    "04E": "Toxic chemical improperly labeled, stored or used such that food contamination may occur.",
    "04F": "Food, food preparation area, food storage area, area used by employees or patrons, contaminated by sewage or liquid waste.",
    "04G": "Unprotected potentially hazardous food re-served.",
    "04H": "Raw, cooked or prepared food is adulterated, contaminated, cross-contaminated, or not discarded in accordance with HACCP plan.",
    "04I": "Unprotected food re-served.",
    "04J": "Appropriately scaled metal stem-type thermometer or thermocouple not provided or used to evaluate temperatures of potentially hazardous foods during cooking, cooling, reheating and holding.",
    "04K": "Evidence of rats or live rats present in facility's food and/or non-food areas.",
    "04L": "Evidence of mice or live mice in establishment's food or non-food areas.",
    "04M": "Live roaches in facility's food or non-food area.",
    "04N": "Filth flies or food/refuse/sewage-associated (FRSA) flies present in facilities food and/or non-food areas.Filth flies include house flies.",
    "04O": "Live animals other than fish in tank or service animal present in facility's food and/or non-food areas.",
    "04P": "Food containing a prohibited substance held, kept, offered, prepared, processed, packaged, or served.",
    "05A": "Sewage disposal system improper or unapproved.",
    "05B": "Harmful, noxious gas or vapor detected. CO =13 ppm.",
    "05C": "Food contact surface improperly constructed or located. Unacceptable material used.",
    "05D": "No hand washing facility in or adjacent to toilet room or within 25 feet of a food preparation, food service or ware washing area.  Hand washing facility not accessible, obstructed or used for non-hand washing purposes. No hot and cold running water or water at inadequate pressure. No soap or acceptable hand-drying device.",
    "05E": "Insufficient or no refrigerated or hot holding equipment to keep potentially hazardous foods at required temperatures.",
    "05F": "Insufficient or no refrigerated or hot holding equipment to keep potentially hazardous foods at required temperatures.",
    "05F": "Insufficient or no refrigerated or hot holding equipment to keep potentially hazardous foods at required temperatures.",
    "05H": "No facilities available to wash, rinse and sanitize utensils and/or equipment.",
    "06A": "Personal cleanliness inadequate. Outer garment soiled with possible contaminant. Effective hair restraint not worn in an area where food is prepared.",
    "06B": "Tobacco use, eating, or drinking from open container in food preparation, food storage or dishwashing area observed.",
    "06C": "Food not protected from potential source of contamination during storage, preparation, transportation, display or service.",
    "06D": "Food contact surface not properly washed, rinsed and sanitized after each use and following any activity when contamination may have occurred.",
    "06E": "Sanitized equipment or utensil, including in-use food dispensing utensil, improperly used or stored.",
    "06F": "Wiping cloths soiled or not stored in sanitizing solution.",
    "06G": "HACCP plan not approved or approved HACCP plan not maintained on premises.",
    "06H": "Records and logs not maintained to demonstrate that HACCP plan has been properly implemented.",
    "06I": "Food not labeled in accordance with HACCP plan.",
    "06J": "Written Standard Operating Procedure (SOP) approved by the Department for refillable, reusable containers not available at the time of inspection.  Container construction improper",
    "07A": "Duties of an officer of the Department interfered with or obstructed.",
    "08A": "Establishment is not free of harborage or conditions conducive to rodents, insects or other pests.",
    "08B": "Covered garbage receptacle not provided or inadequate, except that garbage receptacle may be uncovered during active use. Garbage storage area not properly constructed or maintained; grinder or compactor dirty.",
    "08C": "Pesticide use not in accordance with label or applicable laws. Prohibited chemical used/stored. Open bait station used.",
    "09A": "Canned food product observed dented and not segregated from other consumable food items.",
    "09B": "Thawing procedure improper.",
    "09C": "Food contact surface not properly maintained.",
    "09D": "Food service operation occurring in room or area used as living or sleeping quarters.",
    "09E": "Wash hands sign not posted near or above hand washing sink.",
    "10A": "Toilet facility not maintained and provided with toilet paper, waste receptacle and self-closing door.",
    "10B": "Plumbing not properly installed or maintained; anti-siphonage or backflow prevention device not provided where required; equipment or floor not properly drained; sewage disposal system in disrepair or not functioning properly.",
    "10C": "Lighting Inadequate",
    "10D": "Mechanical or natural ventilation system not provided,  improperly installed, in disrepair and/or fails to prevent excessive build-up of grease, heat, steam condensation vapors, odors, smoke, and fumes.",
    "10E": "Accurate thermometer not provided in refrigerated or hot holding equipment.",
    "10H": "Proper sanitization not provided for utensil ware washing operation.",
    "10I": "Single service item reused, improperly stored, dispensed; not used when required.",
    "10J": "Hand wash sign not posted",
    "22F": "MISBRANDED AND LABELING",
    "10F": "Non-food contact surface improperly constructed. Unacceptable material used. Non-food contact surface or equipment improperly maintained and/or not properly sealed, raised, spaced or movable to allow accessibility for cleaning on all sides, above and underneath the unit.",
    "10G": "Dishwashing and ware washing:  Cleaning and sanitizing of tableware, including dishes, utensils, and equipment deficient."

      }

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
    //label x
    violationSvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y",-30)
        .style("text-anchor", "middle")
        .attr('font-size', 10)
        .attr('font-family', "sans-serif")
        .text("Violation Count");
    //label y
    violationSvg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + 30) + ")")
        .style("text-anchor", "middle")
        .attr('font-size', 10)
        .attr('font-family', "sans-serif")
        .text("Violation Code");
    //var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('padding', '10px')
        .style('background', 'rgba(0,0,0,0.6)')
        .style('border-radius', '4px')
        .style('color', '#fff')
       
   

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
      .on("mouseover", function (event, d) {
          console.log(d[0])
          console.log(a[d[0]])
          tooltip
              .html(
                  (`<div>${a[d[0]]}</div>`)
          )
              .style('visibility', 'visible');
          d3.select(this).transition().attr('fill', '#29453e');
                 
          
      })
      .on('mousemove', function (event, d) {
          tooltip
              .style('top', event.pageY - 10 + 'px')
              .style('left', event.pageX + 10 + 'px');
      })
      .on("mouseout", function (event, d) {
          
          tooltip.html(``).style('visibility', 'hidden');
          d3.select(this).transition().attr('fill', "#69b3a2");

          
      });
}
function UpdatedviolationsInSelectedArea() {
  violationSvg.selectAll("*").remove();
  // violation data
    // filteredViolationData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
    if (selectedZip.length != 0) {
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

        //label x
        violationSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", -30)
            .style("text-anchor", "middle")
            .attr('font-size', 10)
            .attr('font-family', "sans-serif")
            .text("Violation Count");
        //label y
        violationSvg.append("text")
            .attr("transform", "translate(" + (width / 2) + " ," + (height + 30) + ")")
            .style("text-anchor", "middle")
            .attr('font-size', 10)
            .attr('font-family', "sans-serif")
            .text("Violation Code");

        tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .style('padding', '10px')
            .style('background', 'rgba(0,0,0,0.6)')
            .style('border-radius', '4px')
            .style('color', '#fff')
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
            .on("mouseover", function (event, d) {
                console.log(d[0])
                console.log(a[d[0]])
                tooltip
                    .html(
                        (`<div>${a[d[0]]}</div>`)
                    )
                    .style('visibility', 'visible');
                d3.select(this).transition().attr('fill', '#29453e');


            })
            .on('mousemove', function (event, d) {
                tooltip
                    .style('top', event.pageY - 10 + 'px')
                    .style('left', event.pageX + 10 + 'px');
            })
            .on("mouseout", function (event, d) {

                tooltip.html(``).style('visibility', 'hidden');
                d3.select(this).transition().attr('fill', "#69b3a2");


            });
    }
}


