
d3.csv("316e22cd-4d76-44ea-96f4-eb31ff4bb3e1_Data.csv").then(
    function(dataset){
        
        d3.json("map.json").then(function(mapdata){

            console.log(dataset)
            console.log(mapdata)

            //starting by creating an easier way to access my data by country
            var countryPop = {}
            dataset.forEach(d => {
                countryPop[d["Country Code"]] = +d["2019 [YR2019]"]
            })

            var size = 800
            var dimensions = ({
                width: size, 
                height: size/2,
                margin: {
                 top: 10,
                 right: 10,
                 bottom: 10,
                 left: 10
                }
               })


            var svg = d3.select("svg").attr("width", dimensions.width)
                                    .attr("height", dimensions.height)
  
            var projection = d3.geoEqualEarth() //geoOrthographic() //geoMercator()
                                .fitWidth(dimensions.width, {type: "Sphere"})

            var pathGenerator = d3.geoPath(projection)

            var earth = svg.append("path")
                        .attr("d", pathGenerator({type: "Sphere"}))
                        .attr("fill", "lightblue")

            var graticule = svg.append("path")
                            .attr("d", pathGenerator(d3.geoGraticule10()))
                            .attr("stroke", "gray")
                            .attr("fill", "none")

            var color = d3.scaleLinear()
                .domain([d3.min(Object.values(countryPop)),0,d3.max(Object.values(countryPop))])
                .range(["red", "white","blue"])


            var countries = svg.append("g")
                            .selectAll(".country")
                            .data(mapdata.features)
                            .enter()
                            .append("path")
                            .attr("class", "country")
                            .attr("d", d => pathGenerator(d))
                            .style("fill", d => { console.log(d.properties.SOV_A3); return color(countryPop[d.properties.SOV_A3])})
                            
            
        })
    }
)