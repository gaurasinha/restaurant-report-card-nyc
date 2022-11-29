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
var selectedCuisineGrade = [];
var yAxisCBar;

var markerIcon = [new L.Icon.Default({ iconUrl: 'marker-icon-green.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-green-2x.png' }),
new L.Icon.Default({ iconUrl: 'marker-icon-yellow.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-yellow-2x.png' }),
new L.Icon.Default({ iconUrl: 'marker-icon-red.png', shadowUrl: 'marker-shadow.png', iconRetinaUrl: 'marker-icon-red-2x.png' })]

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

      setTimeout(showCuisine('11378'), 100000);
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


function zoomToFeature(e) {
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
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(e => d.CAMIS == e.CAMIS)
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // }
    // )

    var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">' + d.DBA + '</span><br>' + d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET + '<svg id="chart"></svg></div>')[0];


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
  violationsInSelectedArea();
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

function updateCuisine() {
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
    .range([0, cuisineDimensions.width - cuisineDimensions.margin.right - cuisineDimensions.margin.left])

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

function updateSelectedData() {
  var cuisineGroup = d3.rollup(d3.filter(restData, x => selectedZip.includes(x.ZIPCODE)), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(2, parseInt(d.AvgScore / 14)))
  //  d3.rollup(, v => v.length, d => Math.min(5,parseInt(d.AvgScore/5)))
  // console.log(d3.flatRollup(d3.filter(restData, x => x.ZIPCODE == zip), v => v.length, d => d['CUISINE DESCRIPTION'], d => Math.min(5, parseInt(d.AvgScore / 10))))
  var arrayData = []
  cuisineGroup.forEach(function (value, key) {
    sum = 0;
    for (j = 0; j < 3; j++) {
      if (value.get(j) != undefined) {
        sum += value.get(j)
        arrayData.push([key, j, sum])
      }
    }
  })
  arrayData.sort((a, b) => b[2] - a[2])
  return arrayData
}

function getCuisineKeys(selectedData) {
  var cuisineNames = new Set(selectedData.map(d => d[0]))
  return Array.from(cuisineNames).slice(0, 20)
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
    .attr("fill", (d, i) => groupColors[d[1]])
    .attr("height", d => yScaleCBar.bandwidth())
    .attr("width", d => xScaleCBar(d[2]))
  yAxisCBar = svgcuisine.append("g")
    .call(yAxisgenCBar)
    .style("text-anchor", "start")
    .style('stroke', 'white')
    .style('stroke-width', '3')
    .style('paint-order', 'stroke')
    .style("transform", `translateX(3px)`)
    .style("stroke-linecap", 'butt')
    .style('stroke-linejoin', 'miter')
  yAxisCBar.selectAll('path').style('display', 'none')
  filteredData = restData.filter(d => selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
    inspectData = gradeData.filter(e => d.CAMIS == e.CAMIS)
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // })
    // var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:200px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><p>'+inspectionResult+'</p><svg id="chart"></svg></div>')[0];

    var div = $('<div id="' + d.CAMIS + '" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">' + d.DBA + '</span><br>' + d['CUISINE DESCRIPTION'] + ' Tel:' + d.PHONE + '<br>' + d.BUILDING + ' ' + d.STREET + '<svg id="chart"></svg></div>')[0];


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
  violationsInSelectedArea();
}


function violationsInSelectedArea() {
  var svgarea = d3.select("violation");
  svgarea.selectAll("*").remove();

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


  // const svgContainer = d3.select('#container');
  // set the dimensions and margins of the graph
  var margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 660 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // append the svg object to the body of the page

  var violationSvg = d3.select("#violation")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

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
    .data(arrayTmp)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d[1]); })
    .attr("fill", "#69b3a2")

  // const margin = 80;
  // const width = 1000 - 2 * margin;
  // const height = 600 - 2 * margin;

  // const chart = violationSvg.append('g')
  //   .attr('transform', `translate(${margin}, ${margin})`);

  // const xScale = d3.scaleBand()
  //   .range([0, width])
  //   .domain(arrayDatas)
  //   .padding(0.4)

  // const yScale = d3.scaleLinear()
  //   .range([height, 0])
  //   .domain([0, 100]);

  // // vertical grid lines
  // // const makeXLines = () => d3.axisBottom()
  // //   .scale(xScale)

  // const makeYLines = () => d3.axisLeft()
  //   .scale(yScale)

  // chart.append('g')
  //   .attr('transform', `translate(0, ${height})`)
  //   .call(d3.axisBottom(xScale));

  // chart.append('g')
  //   .call(d3.axisLeft(yScale));

  // // vertical grid lines
  // // chart.append('g')
  // //   .attr('class', 'grid')
  // //   .attr('transform', `translate(0, ${height})`)
  // //   .call(makeXLines()
  // //     .tickSize(-height, 0, 0)
  // //     .tickFormat('')
  // //   )

  // chart.append('g')
  //   .attr('class', 'grid')
  //   .call(makeYLines()
  //     .tickSize(-width, 0, 0)
  //     .tickFormat('')
  //   )

  // const barGroups = chart.selectAll()
  //   .data(arrayTmp)
  //   .enter()
  //   .append('g')

  // barGroups
  //   .append('rect')
  //   .attr('class', 'bar')
  //   .attr('x', (g) => xScale(g.key) )
  //   .attr('y', (g) => yScale(g.value))
  //   .attr('height', (g) => height - yScale(g.value))
  //   .attr('width', xScale.bandwidth())
  //   .on('mouseenter', function (actual, i) {
  //     d3.selectAll('.value')
  //       .attr('opacity', 0)

  //     d3.select(this)
  //       .transition()
  //       .duration(300)
  //       .attr('opacity', 0.6)
  //       .attr('x', (a) => xScale(a.Vcode) - 5)
  //       .attr('width', xScale.bandwidth() + 10)


  //     const y = yScale(actual.value)

  //     // line = chart.append('line')
  //     //   .attr('id', 'limit')
  //     //   .attr('x1', 0)
  //     //   .attr('y1', y)
  //     //   .attr('x2', width)
  //     //   .attr('y2', y)

  //     barGroups.append('text')
  //       .attr('class', 'divergence')
  //       .attr('x', (a) => xScale(a.Vcode) + xScale.bandwidth() / 2)
  //       .attr('y', (a) => yScale(a.value) + 30)
  //       .attr('text-anchor', 'middle')
  //       // .text((a, idx) => {
  //       //   const divergence = (a.value - actual.value).toFixed(1)

  //       //   let text = ''
  //       //   if (divergence > 0) text += '+'
  //       //   text += `${divergence}%`

  //       //   return idx !== i ? text : '';
  //       // })

  //   })
  //   .on('mouseleave', function () {
  //     d3.selectAll('.value')
  //       .attr('opacity', 1)

  //     d3.select(this)
  //       .transition()
  //       .duration(300)
  //       .attr('opacity', 1)
  //       .attr('x', (a) => xScale(a.Vcode))
  //       .attr('width', xScale.bandwidth())

  //     // chart.selectAll('#limit').remove()
  //     chart.selectAll('.divergence').remove()
  //   })

  // barGroups 
  //   .append('text')
  //   .attr('class', 'value')
  //   .attr('x', (a) => xScale(a.Vcode) + xScale.bandwidth() / 2)
  //   .attr('y', (a) => yScale(a.value) + 30)
  //   .attr('text-anchor', 'middle')
  //   .text((a) => `${a.value}%`)
  //   .attr('fill', 'white')

  //   violationSvg
  //   .append('text')
  //   .attr('class', 'label')
  //   .attr('x', -(height / 2) - margin)
  //   .attr('y', margin / 2.4)
  //   .attr('transform', 'rotate(-90)')
  //   .attr('text-anchor', 'middle')
  //   .text('Count')
  //   .attr('fill', 'white')

  //   violationSvg.append('text')
  //   .attr('class', 'label')
  //   .attr('x', width / 2 + margin)
  //   .attr('y', height + margin * 1.7)
  //   .attr('text-anchor', 'middle')
  //   .text('Violation Code')
  //   .attr('fill', 'white')

  //   violationSvg.append('text')
  //   .attr('class', 'title')
  //   .attr('x', width / 2 + margin)
  //   .attr('y', 40)
  //   .attr('text-anchor', 'middle')
  //   .text('Violations in New York')
  //   .attr('fill', 'white')

  //   violationSvg.append('text')
  //   .attr('class', 'source')
  //   .attr('x', width - margin / 2)
  //   .attr('y', height + margin * 1.7)
  //   .attr('text-anchor', 'start')
  //   .attr('fill', 'white')


}

