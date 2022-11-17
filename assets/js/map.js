var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


var scaleColor = d3.scaleSequential(d3.interpolateRdYlGn)
  .domain(d3.extent(zipdata.features, d => +d.properties.AvgScore))


d3.csv('assets/data/restrauntAvg.csv').then(function (data) {


function style(feature) {
  return {
    fillColor: scaleColor(feature.properties.AvgScore),
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
  var geoBounds = e.target.getBounds();

  latRange = calcRange(geoBounds._northEast.lat, geoBounds._southWest.lat)
  lngRange = calcRange(geoBounds._northEast.lng, geoBounds._southWest.lng)

  //filter data falling within geobounds
  filteredData = data.filter(function(d){ return  (d.Latitude >= latRange[0] && d.Latitude <= latRange[1] && d.Longitude >= lngRange[0] && d.Longitude <= lngRange[1]) })
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

geojson = L.geoJson(zipdata, {
  style: style,
  onEachFeature: onEachFeature
}).addTo(map);

});