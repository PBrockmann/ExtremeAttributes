var markers = [];

var grat;

var filter;

var charts;
var domCharts;

var latDimension;
var lonDimension;
var idDimension;
var idGroup;
//var regionDimension;
var regionGroup;
var saveRegionGroup; //regionGroup when no regions or filters are selected
var yearGroup;
var indexGroup;
var datasetGroup;
var clickDC = false;

var events;

//for regionChart
var regionToPassToDC; //one region, obtained from mouse click
var regionToPassToDC_array = []; //array to store each regionToPassToDC
var active_dict = [];
var legend = [];

var matchFlag = -100;
var clearMapFlag = 0;
var grayThreshold = -100;
var activeDictDefault = -100;
var toggleONRegionChartClicked = 555;
var toggleOFFRegionChartClicked = 100;

function init() {
    console.log("in init()!");     
    
    var maxZoom = 9;
    var map = L.map('map').setView([47.0, 1.5], 6);
    L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'LSCE &copy; 2015 | Baselayer &copy; ArcGis',
        maxZoom: maxZoom, //called "Levels of Detail"
    }).addTo(map);

    //d3 + Leaflet + topojson    
    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var path = d3.geo.path().projection(projectPoint);

    //READ CSV ANOMALY DATA AS PARENT LOOP    
    d3.csv("data/anomalous_index_sigma_scenario.csv", function(events) {    
        events.forEach(function(d, i) {
            console.log("in d3.tsv");
        });

        points = events;
        initCrossfilter();
        saveRegionGroup = regionGroup;
        eventList(); //renders Table
        //   update1(); //updates number of Event Types selected

        //http://stackoverflow.com/questions/10805184/d3-show-data-on-mouseover-of-circle
        var totAnom; 
        var tip = d3.tip()
            .attr("class", "d3-tip")
            //.offset([-10, 0])
            .html(function(d) { //get #anomalies for each region               

                //use saveRegionGroup because it contains all regions, whereas regionGroup may be filtered by user selections
                saveRegionGroup.all().forEach(function(r, i) {
                    if (r.key == d.properties.name) {
                        totAnom = r.value;
                    }
                });
                                                   
                //return "<strong><span style='color:light-gray'>Region:</span></strong> " + d.properties.name + "<br># Anomalies: " + totAnom;
                //return "<strong><span style='color:light-gray'>Region:</span></strong> " + d.properties.name;
                return d.properties.name;
            })
        svg.call(tip);
        

        //READ IN ADMIN AND PLACE NAME OVERLAYS FOR BASE LEAFLET MAP OF FRANCE
        d3.json("topojson/FRA_admin12_places.topojson", function(error, admin) {
            if (error) return console.error(error);
            
            admin.objects.FRA_admin12.geometries.forEach(function (d, idx) {                
                active_dict.push({
                    key: d.properties.name,
                    value: activeDictDefault //0
                });
                legend[idx] = d.properties.name;
            });            

            //READ IN LAT AND LON OF SOME CITIES AND PLOT ON TOP OF MAP        
            d3.json("geojson/cities.geojson", function(error, data) {

                var adminunits = topojson.feature(admin, admin.objects.FRA_admin12);
                var bounds = d3.geo.bounds(adminunits);                

                //Extract the admin zone boundaries
                count = 0; savedPoints = []; idx=0;
                var feature = g.selectAll("path")
                    .data(topojson.feature(admin, admin.objects.FRA_admin12).features)
                    .enter()
                    .append("path").attr("id", function(d) { //attach unique id to each region path
                        idname = admin.objects.FRA_admin12.geometries[idx].properties.name.substring(0, 4);      
                        idx++;
                        return idname; 
                    })
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide)
                    .on("click", function(d) {
                            
                        if (clickDC == false) { //can click on map as many times as you want
                            
                                regionToPassToDC = null;
                                regionToPassToDC = d.properties.name;                                            
                                
                                idx = legend.indexOf(regionToPassToDC);

                                //toggle active_dict value on and off
                                if (active_dict[idx].value ==1 ) {
                                    active_dict[idx].value = -100; //0; //turn off activated region                              
                                                                     
                                    //remove from regionToPassToDC_array
                                    iremove = regionToPassToDC_array.indexOf(regionToPassToDC);
                                    regionToPassToDC_array.splice(iremove,1)                                  
                                }
                                else { //activate region
                                    regionToPassToDC_array.push(regionToPassToDC);
                                    active_dict[idx].value = 1;                                                                     
                                }

                                initCrossfilter(); //send regionToPassToDC to dc region filter
                            
                        } else { //clickDC is true

                            for (var j = 0; j < active_dict.length; j++) {
                                if (active_dict[j].value >= 0 && d.properties.name == active_dict[j].key) {                                                        
                                    matchFlag = 1;
                                }
                            }

                            if (matchFlag == 1) { //allow only regions highlighed by dc chart to be clicked
                                grayThreshold = 100;
                                matchFlag = 0; //reset


                                regionToPassToDC = null;
                                regionToPassToDC = d.properties.name;
                                idx = legend.indexOf(regionToPassToDC);
                                
                                //clear array only if map has NOT been clicked
                                if (regionChart.filters().length==0) regionToPassToDC_array = [];
                                console.log("regionToPassToDC_array in on.click: ", regionToPassToDC_array)
                                if (regionToPassToDC_array.indexOf(regionToPassToDC) == -1) regionToPassToDC_array.push(regionToPassToDC); 

                                //toggle active_dict value on and off
                                for (var j = 0; j < active_dict.length; j++) {                                    
                                        if (active_dict[j].key == regionToPassToDC) {                                             
                                            if (active_dict[j].value == toggleONRegionChartClicked) {//toggle region OFF
                                                active_dict[j].value = grayThreshold;
                                            } else {                                                
                                                active_dict[j].value = toggleONRegionChartClicked;                                                
                                            } //toggle region ON
                                        } else if (active_dict[j].key != regionToPassToDC) {                                            
                                            if (active_dict[j].value != -100 && active_dict[j].value != toggleONRegionChartClicked) {                                                
                                                active_dict[j].value = grayThreshold;                                                
                                            }
                                        }
                                }
                                console.log("active_dict in here: ", active_dict);                          
    
                          

                                initCrossfilter();
                            } //end matchFlag check

                        } //end clickDC else condition
                    });

                //by default, all map regions are highlighted
                g.selectAll("path").style("fill", "brown").style("fill-opacity", 0.7)
                  .style("stroke", "gray").style("stroke-width", "1px");

                

                //Update popup window based on selections in dc chart filters
                //NB: use select("path") NOT selectAll("path") as above
                var selectRegion = g.select("path")
                    .data(topojson.feature(admin, admin.objects.FRA_admin12).features)
                    .enter()
                    .append("path")
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide);            

                //Extract the place name labels
                var places = g.selectAll(".place-label")
                    .data(topojson.feature(admin, admin.objects.FRA_places).features)
                    .enter()
                    .append("text")
                    .attr("class", "place-label");

                //Define city markers using the coordinates associated with FRA_places              
                var cityMarker = g.selectAll("circle")
                    .data(topojson.feature(admin, admin.objects.FRA_places).features)
                    .enter()
                    .append("circle")
                    .style("stroke", "black")
                    .style("opacity", 0.6)
                    .style("fill", "#8e8e8e")
                    .attr("class", "city-marker")
                    .attr("r", 2);

                //note: needs to be transformed in resetMap() like the other g nodes in order to stay in place at different zoom levels
                var stationMarker = g.selectAll(".station-marker")
                    .data(data.features)
                    //.data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "station-marker")
                    .style("opacity", .6)
                    .attr("r", 5);


                map.on('viewreset', resetMap); //called when map is zoomed in or out
                resetMap();

                // Reposition the SVG to cover the features.
                function resetMap() {
                        //set opacity of labels and markers depending on zoom level
                        var currentZoom = map.getZoom();
                        //if currentZoom <= 4, don't display place labels                        
                        g.selectAll(".place-label").attr("opacity", currentZoom <= 4 ? 0 : 1);

                        //adjust station marker radius as a fn of zoom level
                        g.selectAll(".station-marker").attr("r", function() {
                            if (currentZoom == 5) return 4;
                            else if (currentZoom <= 4 && currentZoom >= 3) return 2;
                            else if (currentZoom < 3) return 0;
                            else return 5;
                        });

                        //adjust city marker opacity as a fn of zoom level
                        g.selectAll(".city-marker").style("opacity", function() {
                            if (currentZoom == 5) return 0.5;
                            else if (currentZoom <= 4 && currentZoom >= 3) return 0.2;
                            else if (currentZoom < 3) return 0;
                            else return 0.6;
                        });


                        var bottomLeft = projectPoint(bounds[0]),
                            topRight = projectPoint(bounds[1]);

                        svg.attr('width', topRight[0] - bottomLeft[0])
                            .attr('height', bottomLeft[1] - topRight[1])
                            .style('margin-left', bottomLeft[0] + 'px')
                            .style('margin-top', topRight[1] + 'px');

                        var translation = -bottomLeft[0] + ',' + -topRight[1];
                        g.attr('transform', 'translate(' + -bottomLeft[0] + ',' + -topRight[1] + ')');

                        //Plot the admin zone boundaries
                        feature.attr('d', path);

                        //Plot the place names
                        places.attr('name', function(d) { return d.properties.name; })
                            .attr('class', 'place-label')
                            .attr('transform', function(d) { return 'translate(' + path.centroid(d) + ')'; })
                            .attr('x', -20)
                            .attr('dy', '.35em')
                            .text(function(d) { return d.properties.name; });

                        //Position text so that it does not overlap with city marker circles (http://bost.ocks.org/mike/map/)
                        svg.selectAll(".place-label")
                            .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
                            .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });


                        //Plot the city markers (small circles)
                        cityMarker.attr("transform",
                            function(d) { return 'translate(' + path.centroid(d) + ')'; }
                        )

                        stationMarker.attr("transform",
                            function(d) { return 'translate(' + path.centroid(d) + ')';
                            }
                        )

                    } //end resetMap()                                                                

            }); //end d3 geojson
        }); //end d3 topojson


    }); //end d3 csv read file

    //Use Leaflet to implement a D3 geographic projection.
    //Put outside the read file loops
    function projectPoint(x) {
        var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        //console.log(x[1], x[0]);
        //console.log("point.x, point.y: ", point.x, point.y);
        return [point.x, point.y];
    }
    
}

function clearMap() {  
    clearMapFlag = 1;
    initCrossfilter(); //update dc charts with cleared region filter    
}

function initCrossfilter() {

    //FNS FOR CHECKBOXES
    function createFilter(filters) {
        return function (d) {
            //when both checkboxes are cicked, return true if data point        
            //contains either checkbox value    
            for (var i = 0, len = filters.length; i < len; i++) {                        
                if (filters[i] == d) return true;                    
                //if ($.inArray(filters[i], d) == -1) return false;
            }
        }
    }

    function toggleArrayItem(flist, val) {
        //Stores value of check boxes clicked in array "flist"
        var i = flist.indexOf(val);
        if (i === -1) flist.push(val);
        else flist.splice(i, 1);
    }

    function checkboxEval(flist, opt1, opt2, fdim) {
        noBoxChecked = false;
        if (flist.indexOf(opt1) == -1 && flist.indexOf(opt2) == -1) noBoxChecked = true;

        fdim.filterAll();
        console.log("flist: ", flist)
        if (noBoxChecked == false) fdim.filterFunction(createFilter(flist));        
    }
    
    console.log('in initCrossfilter');
    filter = crossfilter(points);

    //EVALUATE CHECKBOXES
    //Sigma value
    $("#tag1").click(function () {
        toggleArrayItem(filter_list, "1"); //Sigma col value == 1
        checkboxEval(filter_list, "1", "2", tags); //both box values
        
        dc.redrawAll();
    });

    $("#tag2").click(function () {
        toggleArrayItem(filter_list, "2"); //Sigma col value == 2
        checkboxEval(filter_list, "1", "2", tags); //both box values
        
        dc.redrawAll();
    });

    //Scenario
    $("#RCP45").click(function () {
        toggleArrayItem(filter_list, "4.5"); //Scenario col value == 4.5
        checkboxEval(filter_list, "4.5", "8.5", scenario); //both box values
        
        dc.redrawAll();
    });

    $("#RCP85").click(function () {
        toggleArrayItem(filter_list, "8.5"); //Scenario col value == 8.5
        checkboxEval(filter_list, "4.5", "8.5", scenario); //both box values
        
        dc.redrawAll();
    });

    //DEFINE CHARTS
    indexChart = dc.rowChart("#chart-indexType");
    datasetChart = dc.rowChart("#chart-dataset");
    yearChart = dc.barChart("#chart-eventYear");
    regionChart = dc.rowChart("#chart-region");

    // set crossfilter
    var yearDimension = filter.dimension(function(p) { return Math.round(p.Year); }),
        regionDimension = filter.dimension(function(p, i) { return p.Region; }),
        indexDimension = filter.dimension(function(p) { return p.Index; }),
        datasetDimension = filter.dimension(function(d) { return d.Data; }),
        tags = filter.dimension(function (d) { return d.Sigma; }),
        scenario = filter.dimension(function (d) { return d.Scenario; }),
        filter_list = [];
  
    //global
    idDimension = filter.dimension(function(p, i) { return i; });
    idGroup = idDimension.group(function(id) { return id; });
    regionGroup = regionDimension.group().reduceSum(function(d) { return d.Value; });
    yearGroup = yearDimension.group().reduceSum(function(d) { return d.Value; });
    indexGroup = indexDimension.group().reduceSum(function(d) { return d.Value; });
    datasetGroup = datasetDimension.group().reduceSum(function(d) { return d.Value; });


    //yearGroup = yearDimension.group(); //counts number of years regardless of whether d.value is empty
    
    //print_filter("yearGroup");
    
    minYear = parseInt(yearDimension.bottom(1)[0].Year) - 5;
    maxYear = parseInt(yearDimension.top(1)[0].Year) + 5;

    indexChart
        .width(200) //svg width
        .height(200) //svg height
        .margins({
            top: 10,
            right: 10,
            bottom: 30,
            left: 10
        }) // Default margins: {top: 10, right: 50, bottom: 30, left: 30}
        .dimension(indexDimension)
        .group(indexGroup)
        .on("preRedraw", update0)
        .colors(d3.scale.category20())
        .elasticX(true)
        .gap(0)
        .on("filtered", function() {
            highlightRegion(indexChart.filters, indexGroup);
        });    

    xAxis_indexChart = indexChart.xAxis().ticks(4);

    yearChart
        .width(200)
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
        .on("preRedraw", update0)
        .colors(d3.scale.category20c())
        //.elasticX(true)
        .renderHorizontalGridLines(true)
        //.round(Math.round)
        .xUnits(function(){return 20;})
        //.gap(2)  
        //.xUnits(dc.units.integers)
        .x(d3.scale.linear().domain([minYear, maxYear]))
        .on("filtered", function() {
            highlightRegion(yearChart.filters, yearGroup);
        })
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
        .on("preRedraw", update0)
        .colors(d3.scale.category20())
        .elasticX(true)
        .gap(0)
        .on("filtered", function() {
            highlightRegion(datasetChart.filters, datasetGroup);
        });

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
        .size(points.length) //display all data
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
          //function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.lat + '+' + d.long +"\" target=\"_blank\">Google Map</a>"},
          //function(d) { return '<a href=\"http://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.long +'&zoom=12'+ "\" target=\"_blank\"> OSM Map</a>"}
        ])
        .sortBy(function(d){ return d.Year; })
        .order(d3.ascending);

    regionChart
        .width(350).height(500)
        .dimension(regionDimension)
        .group(regionGroup)
        .elasticX(true)
        .on("filtered", updateSelectors);    

     
    function updateSelectors() { //executed when map is clicked
        //console.log("regionGroup.all(): ", regionGroup.all());
        console.log("regionChart.filters(): ", regionChart.filters());
    }
    
    if (clearMapFlag ==1) {        
           
        regionToPassToDC_array = [];
        if (clickDC == true) { //reset only those regions that belong in chart click subset            
            for (var i = 0; i < active_dict.length; i++) {
                if (active_dict[i].value != activeDictDefault) {
                    active_dict[i].value = 1;
                    d3.select("#"+active_dict[i].key.substring(0, 4))
                      .style("fill", "brown").style("fill-opacity", 0.7)
                      .style("stroke", "gray").style("stroke-width", "1px");
                    regionToPassToDC_array.push(active_dict[i].key);
                }            
            }

            //update regionChart filter NOT WORKING!!!
            console.log("regionToPassToDC_array in clearMap: ", regionToPassToDC_array)
            regionToPassToDC_array.forEach(function (p, k) {
                regionChart.filter(regionToPassToDC_array[k]);
                console.log("passing to regionChart.filter")
            })

        } else { //reset all regions      
            d3.selectAll("path").style("fill", "brown").style("fill-opacity", 0.7)
                  .style("stroke", "gray").style("stroke-width", "1px");          
        }

        console.log("active_dict in clearMap: ", active_dict);
       
        //reset to default values
        clearMapFlag = 0;
        regionToPassToDC = null;        
        
  
    } else {
        updateRegionChart();
    }

    //Called when map is clicked
    function updateRegionChart() {
        console.log("IN updateRegionChart fn!!")
        console.log("regionChart.filters(): ", regionChart.filters())

        if (regionChart.filters().length == 0) { //if 0, clicked region not yet passed to region chart
            if (regionToPassToDC) {                

               

                legend_idx = legend.indexOf(regionToPassToDC);
                console.log("active_dict[legend_idx].key: ", active_dict[legend_idx].key)
                console.log("active_dict[legend_idx].value: ", active_dict[legend_idx].value)
                if (active_dict[legend_idx].value == grayThreshold) {
                    findi = regionToPassToDC_array.indexOf(active_dict[legend_idx].key);
                    regionToPassToDC_array.splice(findi, 1);
                }
                console.log("regionToPassToDC_array after splice: ", regionToPassToDC_array)
                regionToPassToDC_array.forEach(function (p, k) {
                    regionChart.filter(regionToPassToDC_array[k]);
                })

                //turn deactivated regions gray
                if (clickDC == true) {
                    countThreshold = toggleOFFRegionChartClicked;
                    //countSelection number of entries in active_dict != -100
                    countSelection = 0;
                    for (var j = 0; j < active_dict.length; j++) {
                        if (active_dict[j].value != -100) countSelection++;
                    }

                }
                else {
                    countThreshold = grayThreshold;
                    countSelection = active_dict.length;
                }
                
                count_active=0;
                for (var j = 0; j < active_dict.length; j++) { 
                    if (active_dict[j].value == countThreshold) {
                        count_active++;
                        d3.select("#"+active_dict[j].key.substring(0, 4))
                          .style("fill", "gray").style("fill-opacity", 0.5)
                          .style("stroke", "gray").style("stroke-width", "1px");                                               
                    } else if (active_dict[j].value == toggleONRegionChartClicked) {
                        d3.select("#"+active_dict[j].key.substring(0, 4))
                          .style("fill", "brown").style("fill-opacity", 0.7)
                          .style("stroke", "gray").style("stroke-width", "1px");
                    }             
                }

                if (count_active == countSelection) {
                    //last selected region has been clicked again
                    //restore map to default
                    if (clickDC == true) {
                        regionChart.filterAll(); //clear
                        for (var j = 0; j < regionToPassToDC_array.length; j++) {
                            d3.select("#"+regionToPassToDC_array[j].substring(0, 4)).style("fill", "brown")
                              .style("fill-opacity", 0.7)
                              .style("stroke", "gray").style("stroke-width", "1px");
                              active_dict[legend.indexOf(regionToPassToDC_array[j])].value = toggleONRegionChartClicked;
                              //pass only active regions to chart
                              regionChart.filter(regionToPassToDC_array[j]);
                        }                        
                    } else {
                        d3.selectAll("path").style("fill", "brown").style("fill-opacity", 0.7)
                          .style("stroke", "gray").style("stroke-width", "1px");
                    }
                } else {
                    
                }
            }
        } //end regionChart.filters().length check
    }
 
    //Called when any dc chart is clicked
    function highlightRegion(chartFilter, chartGroup) {            

        //if no filters are selected, highlight no map regions
        if (regionChart.filters().length == 0) { //if 0, map has not been clicked yet
            console.log("IN highlightRegion fn PART I!!****************")
            countRegionGroup = 0;

            regionGroup.all().forEach(function (d, i) {
                if (regionGroup.all()[i].value > 0) {
                    pick = legend.indexOf(regionGroup.all()[i].key);
                    //console.log("pick: ", pick);

                    //set corresponding regions in active_dict to 1
                    active_dict[pick].value = 1;

                    regionToPassToDC_array[countRegionGroup] = regionGroup.all()[i].key;
                    countRegionGroup++

                    pathid = regionGroup.all()[i].key;
                    d3.select("#"+pathid.substring(0, 4))
                      .style("fill", "brown").style("fill-opacity", 0.7)
                      .style("stroke", "gray").style("stroke-width", "1px");                    
                } else { //unselect any regions that may have been previously selected
                    active_dict[i].value = -100;
                    pathid = regionGroup.all()[i].key;
                    d3.select("#"+pathid.substring(0, 4))
                      .style("stroke", null)
                      .style("stroke-width", null).style("fill-opacity", 0);
                }
            });    
                    
        } else { //map has at least one highlighted region            
            
            //first clear all regions               
            d3.selectAll("path")
                .style("stroke", null)
                .style("stroke-width", null).style("fill-opacity", 0);               

            //highlight only those regions that match regionChart.filters()
            for (var j = 0; j < regionChart.filters().length; j++) {
                regionGroup.all().forEach(function (d, i) {                    
                    if (regionGroup.all()[i].value > 0 && regionGroup.all()[i].key == regionChart.filters()[j]) {                        
                        pathid = regionGroup.all()[i].key;                        
                        d3.select("#"+pathid.substring(0, 4))
                          .style("fill", "brown").style("fill-opacity", 0.7)
                          .style("stroke", "gray").style("stroke-width", "1px");
                          //.style("stroke", "brown").style("stroke-width", "2px");
                    }
                });
            }        
        } //end regionChart.filters().length check

    }

    d3.selectAll("#total").text(filter.size()); // total number of events
    d3.select("#active").text(filter.groupAll().value()); //total number selected

    

    dc.renderAll();    

    //Add axis labels
    //http://stackoverflow.com/questions/21114336/how-to-add-axis-labels-for-row-chart-using-dc-js-or-d3-js
    function AddXAxis(chartToUpdate, displayText) {
        chartToUpdate.svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", chartToUpdate.width() / 2)
            .attr("y", chartToUpdate.height())
            .text(displayText);
    }
    AddXAxis(indexChart, "# anomalies");
    AddXAxis(datasetChart, "# anomalies");

    //add x-axis label
    yearChart.svg()
        .append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", -90)
        .attr("y", -1)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("# anomalies");

    function print_filter(filter) {
        var f = eval(filter);
        if (typeof(f.length) != "undefined") {} else {}
        if (typeof(f.top) != "undefined") {
            f = f.top(Infinity);
        } else {}
        if (typeof(f.dimension) != "undefined") {
            f = f.dimension(function(d) {
                return "";
            }).top(Infinity);
        } else {}
        console.log(filter + "(" + f.length + ") = " + JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t").replace("]", "\n]"));
    }

}


// set visibility of markers based on crossfilter
function updateMarkers() {
    var pointIds = idGroup.all();
    for (var i = 0; i < pointIds.length; i++) {
        if (pointIds[i].value > 0)
            markerGroup.addLayer(markers[i]);
        else
            markerGroup.removeLayer(markers[i]);
    }
}

// Update map markers, list and number of selected
function update0() {
    //updateMarkers();

    //set clickDC based on whether dc chart has been clicked or reset
    if (document.getElementsByClassName("reset")[0].style.display == "none" 
            && document.getElementsByClassName("reset")[2].style.display == "none"
            && document.getElementsByClassName("reset")[4].style.display == "none") 
        {
            clickDC = false; //no charts are clicked
            //reset active_dict to default
            for (var j = 0; j < active_dict.length; j++) { 
                active_dict[j].value = activeDictDefault;
            }
            regionToPassToDC_array = [];
           
        }
        else clickDC = true;

    updateList();
    //console.log("updateList regionGroup.all(): ", regionGroup.all());

    //d3.select("#active").text(filter.groupAll().value());
    d3.select("#active").text(function(d) {
        // test = filter.groupAll();
        // console.log("test: ", test.value());
        return filter.groupAll().value();
    });

}

// Update dc charts, map markers, list and number of selected
function update1() {
    dc.redrawAll();
    //updateMarkers();
    //updateList();
    d3.select("#active").text(filter.groupAll().value()); //Renders number of proxies selected
    // levelZoom = map.getZoom();
    // switch(true) {
    // case (levelZoom > 5): 
    //   grat_01.setStyle({opacity: 1.});
    //   break;
    // case (levelZoom > 3): 
    //   grat_01.setStyle({opacity: 0.});
    //   grat_05.setStyle({opacity: 1.});
    //   break;
    // default : 
    //   grat_01.setStyle({opacity: 0.});
    //   grat_05.setStyle({opacity: 0.});
    //   break;
    //}
}

function eventList() {
    //Extreme Events table -- column titles
    var eventItem = d3.select("#eventsListTitle")
        .append("div")
        .style("background", "#ddd")
        .style("font-style", "italic")
        .style("text-align", "left")
        .attr("class", "row");
    eventItem.append("div")
        .attr("class", "col-md-1")
        .text("Id");
    eventItem.append("div")
        .attr("class", "col-md-2")
        .style("text-align", "left")
        .text("Year");
    eventItem.append("div")
        .attr("class", "col-md-3")
        .style("text-align", "left")
        .text("Region");
    eventItem.append("div")
        .attr("class", "col-md-4")
        .style("text-align", "left")
        .text("Type");
    eventItem.append("div")
        .attr("class", "col-md-3")
        .style("text-align", "left")
        .text("Season");
    eventItem.append("div")
        .attr("class", "col-md-3")
        .style("text-align", "left")
        .text("Index");
    eventItem.append("div")
        .attr("class", "col-md-2")
        .style("text-align", "left")
        .text("Dataset");
    eventItem.append("div")
        .attr("class", "col-md-4")
        .style("text-align", "left")
        .text("# anomalies");


    //Extreme Events table -- row values
    var pointIds = idGroup.all();

    for (var i = 0; i < pointIds.length; i++) {
        var eventItem = d3.select("#eventsList")
            .append("div")
            .attr("class", "eventItem row")
            .style("text-align", "left")
            .attr("id", (i + 1).toString())
            .on('click', popupfromlist);
        eventItem.append("div")
            .attr("class", "col-md-1")
            .style("text-align", "left")
            .attr("title", "#" + (i + 1).toString())
            .text("#" + (i + 1).toString());
        eventItem.append("div")
            .attr("class", "col-md-2")
            .style("text-align", "left")
            .attr("title", points[i].Year)
            .text(points[i].Year);
        eventItem.append("div")
            .attr("class", "col-md-3")
            .style("text-align", "left")
            .attr("title", points[i].Region)
            .text(points[i].Region);
        eventItem.append("div")
            .attr("class", "col-md-4")
            .style("text-align", "left")
            .attr("title", points[i].Type)
            .text(points[i].Type);
        eventItem.append("div")
            .attr("class", "col-md-3")
            .style("text-align", "left")
            .attr("title", points[i].Season)
            .text(points[i].Season);
        eventItem.append("div")
            .attr("class", "col-md-3")
            .style("text-align", "left")
            .attr("title", points[i].Index)
            .text(points[i].Index);
        eventItem.append("div")
            .attr("class", "col-md-2")
            .style("text-align", "left")
            .attr("title", points[i].Data)
            .text(points[i].Data);
        eventItem.append("div")
            .attr("class", "col-md-4")
            .style("text-align", "center")
            .attr("title", points[i].Value)
            .text(points[i].Value);
    }
}

function updateList() {
    var pointIds = idGroup.all();
    for (var i = 0; i < pointIds.length; i++) {
        if (pointIds[i].value > 0) $("#" + (i + 1)).show();
        else $("#" + (i + 1)).hide();
    }
}

function popupfromlist() {
    var i = this.id - 1;
    var lng = points[i].Longitude;
    var lat = points[i].Latitude;
    // console.log(i, lng.toFixed(2), lat.toFixed(2));
    // //map.setView(new L.LatLng(lat,lng), 6);
    // //map.panTo(new L.LatLng(lat,lng));
    // //markers[i].openPopup();
    // // https://github.com/Leaflet/Leaflet.markercluster/issues/46
    var m = markers[i];
    markerGroup.zoomToShowLayer(m, function() {
        map.setView(new L.LatLng(lat, lng), 6); // added to handle single marker
        m.openPopup();
    });
    var container = $("#eventsList");
    var scrollTo = $("#" + this.id);
    container.scrollTop(scrollTo.offset().top - container.offset().top + container.scrollTop());
    //$(".eventItem").css("font-weight", "normal"); //bolds the text in the selected row
    $(".eventItem").css("background-color", "#ffffff"); //remove highlight
    //$("#"+this.id).css("font-weight", "bold"); //bolds the text in the selected row
    $("#" + this.id).css("background-color", "#F7FE2E"); //highlights row
}