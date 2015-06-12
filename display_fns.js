function init() {
    console.log("in init()!");

    var franceChart = dc.geoChoroplethChart("#france-chart");
    var indexChart = dc.rowChart("#chart-indexType");
    var yearChart = dc.barChart("#chart-eventYear");
    var datasetChart = dc.rowChart("#chart-dataset");

    d3.csv("data/anomalous_index_sigma_scenario.csv", function (csv) {
    	var filter = crossfilter(csv);   

        var yearDimension = filter.dimension(function(p) { return Math.round(p.Year); }),  
        	indexDimension = filter.dimension(function(p) { return p.Index; }),
        	regionDimension = filter.dimension(function(p, i) { return p.Region; }),
        	datasetDimension = filter.dimension(function(d) { return d.Data; });
        	//tags = filter.dimension(function (d) { return d.Sigma; }),
        	//scenario = filter.dimension(function (d) { return d.Scenario; }),
        	//filter_list = [];     
       
        var yearGroup = yearDimension.group().reduceSum(function(d) { return d.Value; }),
        	indexGroup = indexDimension.group().reduceSum(function(d) { return d.Value; }),
        	regionGroup = regionDimension.group().reduceSum(function(d) { return d.Value; })
        	datasetGroup = datasetDimension.group().reduceSum(function(d) { return d.Value; });

        minYear = parseInt(yearDimension.bottom(1)[0].Year) - 5;
        maxYear = parseInt(yearDimension.top(1)[0].Year) + 5;

        var width = 600, height = 560;

        // var projection = d3.geo.mercator();
        //                    // .center([0,40])                     
        //                    // .rotate([-12,0])

        //ALMOST WORKS!
        // var projection = d3.geo.albers()
        //     .center([0, 55.4])
        //     .rotate([4.4, 0])
        //     //.parallels([50, 60])
        //     //.scale(6000)
        //     .translate([width / 2, height / 2]);

        //http://lookingfora.name/2013/06/14/geofla-d3-js-carte-interactive-des-departements-francais/
        var projection = d3.geo.conicConformal() // Lambert-93
          .center([2.454071, 47.279229]) // On centre la carte sur la France
          .scale(2000)
          .translate([width / 2, height / 2]);                     

        
        //d3.json("geojson/FRA_admin12.json", function (statesJson) {
        d3.json("geojson/myFRA_admin12.json", function (statesJson) {            
        //d3.json("geojson/departements.json", function (statesJson) {
        //d3.json("geojson/us-states.json", function (statesJson) {

        	franceChart.width(600)
                    .height(560)
                    .dimension(regionDimension)
                    .group(regionGroup)
                    //.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
                    .colorDomain([0, 200])
                    //.colorCalculator(function (d) { return d ? franceChart.colors()(d) : '#ccc'; })
                    .projection(projection)
                    .overlayGeoJson(statesJson.features, "state", function (d) {
                        return d.properties.name;
                    })
                    .title(function (d) {
                        return "State: " + d.key + "\nTotal Amount Raised: " + d.value;
                    });

            indexChart.width(200) //svg width
                    .height(200) //svg height
                    .margins({
                        top: 10,
                        right: 10,
                        bottom: 30,
                        left: 10
                    })
                    .dimension(indexDimension)
                    .group(indexGroup)
                    //.on("preRedraw", update0)
                    .colors(d3.scale.category20())
                    .elasticX(true)
                    .gap(0);    

                xAxis_indexChart = indexChart.xAxis().ticks(4);

                yearChart.width(200)
                    .height(200)
                    .margins({
                        top: 10,
                        right: 30,
                        bottom: 30,
                        left: 40
                    })
                    .centerBar(true) //ensure that the bar for the bar graph is centred on the ticks on the x axis
                    .elasticY(true)
                    .dimension(yearDimension)
                    .group(yearGroup)
                    //.on("preRedraw", update0)
                    .colors(d3.scale.category20c())
                    //.elasticX(true)
                    .renderHorizontalGridLines(true)
                    //.round(Math.round)
                    .xUnits(function(){return 20;})
                    //.gap(2)  
                    //.xUnits(dc.units.integers)
                    .x(d3.scale.linear().domain([minYear, maxYear]))              
                    .xAxis().ticks(3).tickFormat(d3.format("d"));

                var yAxis_yearChart = yearChart.yAxis().ticks(6);

                datasetChart
                    .width(200) //svg width
                    .height(80) //svg height
                    .margins({
                        top: 10,
                        right: 10,
                        bottom: 30,
                        left: 5
                    })
                    .dimension(datasetDimension)
                    .group(datasetGroup)
                    //.on("preRedraw", update0)
                    .colors(d3.scale.category20())
                    .elasticX(true)
                    .gap(0);

                xAxis_datasetChart = datasetChart.xAxis().ticks(4);

                //dc dataTable
                dataTable = dc.dataTable("#dc-table-graph");
                // Create datatable dimension
                var timeDimension = filter.dimension(function (d) {
                    return d.Year;
                });
                
                dataTable.width(1060).height(1000)
                    .dimension(timeDimension)
                    .group(function(d) { return ""})
                    .size(csv.length) //display all data
                    .columns([
                        function(d) { return d.Year; },
                        function(d) { return d.Region; },
                        function(d) { return d.Type; },
                        function(d) { return d.Season; },
                        function(d) { return d.Index; },
                        function(d) { return d.Data; },
                        function(d) { return d.Sigma; },
                        function(d) { return d.Scenario; },
                        function(d) { return d.Value; }                  
                    ])
                    .sortBy(function(d){ return d.Year; })
                    .order(d3.ascending);                

           	dc.renderAll();

        }); //end geojson
    }); //end csv
}