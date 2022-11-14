d3.csv("name-data.csv").then(
    function(dataset){
        var dimensions = {
            width: 1100,
            height: 600,
            margin:{
                top: 10,
                bottom: 50,
                right: 10,
                left: 50
            }
        }

        var name = 'Amanda'

        var svg = d3.select("#barchart")
                    .style("width", dimensions.width)
                    .style("height", dimensions.height)
        
        var xScale = d3.scaleBand()
                       .domain(d3.map(dataset, d => +d.year))
                       .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
                       .padding([0.2])
        
        var yScale = d3.scaleLinear()
                       .domain(d3.extent(dataset, d => +d[name]))
                       .range([dimensions.height-dimensions.margin.bottom, dimensions.margin.top])

        var colorScale = d3.scaleSequential()
                           .domain(d3.extent(dataset, d => +d[name]))
                           .interpolator(d3.interpolateCividis)
        
        var bars = svg.append("g")
                      .selectAll("rect")
                      .data(dataset)
                      .enter()
                      .append("rect")
                      .attr("x", d => xScale(+d.year))
                      .attr("y", d => yScale(d[name]))
                      .attr("height", d => dimensions.height-yScale(d[name])-dimensions.margin.bottom)
                      .attr("width", d => xScale.bandwidth())
                      .attr("fill", d => colorScale(d[name]))
                      .attr('year', d => d.year)
                      .attr('count', d => d[name])
        
        var xAxisGen = d3.axisBottom().scale(xScale).tickValues(xScale.domain().filter((d, i) => d % 2 === 0))
        var xAxis = svg.append("g")
                       .call(xAxisGen)
                       .style("transform", `translateY(${dimensions.height-dimensions.margin.bottom}px)`)
                       .selectAll("text")
                       .attr("transform", `rotate(-65,5,15)`);
              
        var yAxisGen = d3.axisLeft().scale(yScale)
        var yAxis = svg.append("g")
                       .call(yAxisGen)
                       .style("transform", `translateX(${dimensions.margin.left}px)`)
        
    }
)