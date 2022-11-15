var map = L.map('map').setView([40.7055025, -73.977681], 10);

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
L.geoJson(zipdata, {style: style}).addTo(map);
