var map = L.map('map').setView([40.7055025, -73.977681], 10);
var geojson;
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var scaleColor = d3.scaleSequential(d3.interpolateRdYlGn)
                  .domain(d3.extent(zipdata.features, d => +d.properties.POPULATION))

function style(feature) {
  return {
      fillColor: scaleColor(feature.properties.POPULATION),
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

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
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