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
var ViolationCodeData;
d3.csv('assets/data/restrauntAvg.csv').then(function (data) {

  restData = data;

  geojson = L.geoJson(zipdata, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);
  d3.csv('assets/data/ViolationData.csv').then(function(Vdata){
    ViolationCodeData = Vdata
      })
  d3.csv('assets/data/Inspection_Full.csv').then(function(dataGrade){
    gradeData = dataGrade
    
    setTimeout(showCuisine('11378'), 10000);
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
    inspectData = gradeData.filter(e => d.CAMIS==e.CAMIS)
    // var inspectionResult = ""
    // inspectData.forEach(function (e){
    //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
    // }
    // )

  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">'+d.DBA+'</span><br>'+d['CUISINE DESCRIPTION']+' Tel:'+d.PHONE+'<br>'+d.BUILDING+' '+d.STREET+'<svg id="chart"></svg></div>')[0];


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
  inspectData = gradeData.filter(e => d.CAMIS==e.CAMIS)
  // var inspectionResult = ""
  // inspectData.forEach(function (e){
  //   inspectionResult+=e.INSPECTION_DATE + ': ' + e.GRADE +'<br />';
  // })
  // var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:200px;"><p style="font-weight: bold;color:darkorange">Food Grades: 2021-22</p><p style="font-weight: bold;">'+d.DBA+'</p><p>'+inspectionResult+'</p><svg id="chart"></svg></div>')[0];
  
  var div = $('<div id="'+  d.CAMIS +'" style="width: 200px; height:170px;"><span style="font-weight: bold;color: black;">'+d.DBA+'</span><br>'+d['CUISINE DESCRIPTION']+' Tel:'+d.PHONE+'<br>'+d.BUILDING+' '+d.STREET+'<svg id="chart"></svg></div>')[0];


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

// violation data
// filteredViolationData = restData.filter(d=> selectedZip.includes(d.ZIPCODE))
  filteredData.forEach(function (d) {
  VCData = ViolationCodeData.filter(function (e){return (d.Latitude==e.Latitude)})
  })
  console.log(VCData);

  const sample = [
    {
      language: '10F',
      value: 78.9,
      color: '#000000'
    },
    {
      language: '08A',
      value: 75.1,
      color: '#00a2ee'
    },
    {
      language: '04L',
      value: 68.0,
      color: '#fbcb39'
    },
    {
      language: '06D',
      value: 67.0,
      color: '#007bc8'
    },
    {
      language: '06C',
      value: 65.6,
      color: '#65cedb'
    },
    {
      language: '10B',
      value: 65.1,
      color: '#ff6e52'
    },
    {
      language: '02G',
      value: 61.9,
      color: '#f9de3f'
    },
    {
      language: '04N',
      value: 60.4,
      color: '#5d2f8e'
    },
    {
      language: '02B',
      value: 59.6,
      color: '#008fc9'
    },
    {
      language: '04M',
      value: 59.6,
      color: '#507dca'
    }
  ];

  // const svg = d3.select('violationSvg');
  var violationSvg = d3.select("#violation")
  const svgContainer = d3.select('#container');
  
  const margin = 80;
  const width = 1000 - 2 * margin;
  const height = 600 - 2 * margin;

  const chart = violationSvg.append('g')
    .attr('transform', `translate(${margin}, ${margin})`);

  const xScale = d3.scaleBand()
    .range([0, width])
    .domain(sample.map((s) => s.language))
    .padding(0.4)
  
  const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 100]);

  // vertical grid lines
  // const makeXLines = () => d3.axisBottom()
  //   .scale(xScale)

  const makeYLines = () => d3.axisLeft()
    .scale(yScale)

  chart.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  chart.append('g')
    .call(d3.axisLeft(yScale));

  // vertical grid lines
  // chart.append('g')
  //   .attr('class', 'grid')
  //   .attr('transform', `translate(0, ${height})`)
  //   .call(makeXLines()
  //     .tickSize(-height, 0, 0)
  //     .tickFormat('')
  //   )

  chart.append('g')
    .attr('class', 'grid')
    .call(makeYLines()
      .tickSize(-width, 0, 0)
      .tickFormat('')
    )

  const barGroups = chart.selectAll()
    .data(sample)
    .enter()
    .append('g')

  barGroups
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (g) => xScale(g.language) )
    .attr('y', (g) => yScale(g.value))
    .attr('height', (g) => height - yScale(g.value))
    .attr('width', xScale.bandwidth())
    .on('mouseenter', function (actual, i) {
      d3.selectAll('.value')
        .attr('opacity', 0)

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 0.6)
        .attr('x', (a) => xScale(a.language) - 5)
        .attr('width', xScale.bandwidth() + 10)
        

      const y = yScale(actual.value)

      line = chart.append('line')
        .attr('id', 'limit')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)

      barGroups.append('text')
        .attr('class', 'divergence')
        .attr('x', (a) => xScale(a.language) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a, idx) => {
          const divergence = (a.value - actual.value).toFixed(1)
          
          let text = ''
          if (divergence > 0) text += '+'
          text += `${divergence}%`

          return idx !== i ? text : '';
        })

    })
    .on('mouseleave', function () {
      d3.selectAll('.value')
        .attr('opacity', 1)

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('x', (a) => xScale(a.language))
        .attr('width', xScale.bandwidth())

      chart.selectAll('#limit').remove()
      chart.selectAll('.divergence').remove()
    })

  barGroups 
    .append('text')
    .attr('class', 'value')
    .attr('x', (a) => xScale(a.language) + xScale.bandwidth() / 2)
    .attr('y', (a) => yScale(a.value) + 30)
    .attr('text-anchor', 'middle')
    .text((a) => `${a.value}%`)
    .attr('fill', 'white')
  
    violationSvg
    .append('text')
    .attr('class', 'label')
    .attr('x', -(height / 2) - margin)
    .attr('y', margin / 2.4)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text('Count')
    .attr('fill', 'white')

    violationSvg.append('text')
    .attr('class', 'label')
    .attr('x', width / 2 + margin)
    .attr('y', height + margin * 1.7)
    .attr('text-anchor', 'middle')
    .text('Violation Code')
    .attr('fill', 'white')

    violationSvg.append('text')
    .attr('class', 'title')
    .attr('x', width / 2 + margin)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .text('Violations in New York')
    .attr('fill', 'white')

    violationSvg.append('text')
    .attr('class', 'source')
    .attr('x', width - margin / 2)
    .attr('y', height + margin * 1.7)
    .attr('text-anchor', 'start')
    .attr('fill', 'white')
    



}
