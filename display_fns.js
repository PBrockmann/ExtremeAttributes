
//var map;
var markers = [] ;
//var markerGroup ;

var grat;

var filter;
var depthDimension;
var depthGrouping;
var oldestDateDimension;
var oldestDateGrouping;
var eventDimension;
var eventGrouping;
var charts;
var domCharts;

var latDimension;
var lonDimension;
var idDimension;
var idGrouping;


function initCrossfilter() {
  filter = crossfilter(points);
  console.log('in initCrossfilter');

  // dimension and group for looking up currently selected markers
  idDimension = filter.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });


  // simple dimensions and groupings for major variables
  
  eventDimension = filter.dimension(
      function(p) {
        return p.Type;
      });
  eventGrouping = eventDimension.group();
  eventChart  = dc.rowChart("#chart-eventType");

  yearDimension = filter.dimension(
      function(p) {
        return Math.round(p.Year);
      });
  yearGrouping = yearDimension.group();
  yearChart  = dc.barChart("#chart-eventYear");

  // xAxis_yearChart = yearChart.xAxis();
  // xAxis_yearChart.ticks(6);  //.tickFormat(d3.format(".0f"));

  eventChart
    .width(200) //svg width
    .height(200) //svg height
    .margins({top: 10, right: 10, bottom: 30, left: 10})    // Default margins: {top: 10, right: 50, bottom: 30, left: 30}
    .dimension(eventDimension)
    .group(eventGrouping)
    .on("preRedraw",update0)
    .colors(d3.scale.category20()) 
    .elasticX(true)
    .gap(0);

  xAxis_eventChart = eventChart.xAxis().ticks(4);

  yearChart
    .width(200)
    .height(200)
    .centerBar(true) //ensure that the bar for the bar graph is centred on the ticks on the x axis
    .elasticY(true)
    .dimension(yearDimension)
    .group(yearGrouping)
    .on("preRedraw",update0)
    .colors(d3.scale.category20c())
    //.elasticX(true)
    .renderHorizontalGridLines(true)
    //.round(Math.round)
    //.xUnits(function(){return 2;})
    .xUnits(dc.units.integers)
    .x(d3.scale.linear().domain([2008, 2016]))
    .xAxis().ticks(3).tickFormat(d3.format("d"));

  var yAxis_yearChart = yearChart.yAxis().ticks(6);

  dc.renderAll();

}

function init_tsCrossfilter() {
  //var obsLineChart = dc.lineChart("#dc-obsLine-chart");
  var obsLineChart = dc.seriesChart("#dc-obsLine-chart");

  //Read in time series file
  d3.csv("data/quake-later3.csv", function (data) {  
    console.log("in d3.csv");

    //format our data
    var dtgFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");
    //var dtgFormat2 = d3.time.format("%a %e %b %H:%M");

    //for quake-later3.csv
    data.forEach(function(d) { 
      d.dtg1  = d.origintime.substr(0,10) + " " + d.origintime.substr(11,8);      
      d.dtg   = dtgFormat.parse(d.origintime.substr(0,19));
      d.lat   = +d.latitude;
      d.lon  = +d.longitude;
      d.mag   = d3.round(+d.magnitude,1);
      d.depth = d3.round(+d.depth,0);   
    });

    // Run the data through crossfilter and load our 'facts'
    var facts = crossfilter(data);

    // time chart filters
    //--------------------
    //for quake-later3.csv
    var volumeByHour = facts.dimension(function(d) {
      //console.log("d3.time.hour(d.dtg): ", d3.time.hour(d.dtg));
      return d3.time.hour(d.dtg);
    });
    var volumeByHourGroup = volumeByHour.group()
      .reduceCount(function(d) { 
        console.log("in group: ", d.dtg);
        return d.dtg; 
      });

    console.log("volumeByHourGroup: ", volumeByHourGroup);


    // Time Series Plot
    //------------------
    // //Configuration for dc.lineChart
    // obsLineChart.width(960)
    //   .height(150)
    //   .transitionDuration(500)
    //   .margins({top: 10, right: 10, bottom: 20, left: 40})
    //   .dimension(volumeByHour)
    //   .group(volumeByHourGroup)
    //   .elasticY(true)
    //   .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.dtg; })))
    //   .xAxis();

    //Configuration for dc.seriesChart
    //---------------------------------
    //for quake-later3.csv:
    obsLineChart.width(960)
      .height(150)
      //.chart(function(c) { return dc.lineChart(c).interpolate('basis'); })
      .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.dtg; })))
      .margins({top: 10, right: 10, bottom: 20, left: 40})
      .brushOn(false)
      .yAxisLabel("Number per hour")
      .xAxisLabel("Date")
      .clipPadding(10)
      .elasticY(true)
      .dimension(volumeByHour)
      .group(volumeByHourGroup)
      .transitionDuration(500)
      .mouseZoomable(true)    
      .seriesAccessor(function(d) {return "Expt: " + d.key[7];}); //for quake-later3.csv

    dc.renderAll();

  }); //end d3.csv

}

// set visibility of markers based on crossfilter
function updateMarkers() {
  var pointIds = idGrouping.all();
  for (var i = 0; i < pointIds.length; i++) {
    if (pointIds[i].value > 0)
      markerGroup.addLayer(markers[i]);
    else  
      markerGroup.removeLayer(markers[i]);
  }
}

// Update map markers, list and number of selected
function update0() {
  updateMarkers();
  updateList();
  d3.select("#active").text(filter.groupAll().value());
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
          .text("Region");
        eventItem.append("div")
          .attr("class", "col-md-3")
          .style("text-align", "left")
          .text("Type");
        eventItem.append("div")
          .attr("class", "col-md-1")
          .style("text-align", "left")
          .text("Year");
        eventItem.append("div")
          .attr("class", "col-md-2")
          .style("text-align", "left")
          .text("Season");
        eventItem.append("div")
          .attr("class", "col-md-1")
          .style("text-align", "left")
          .text("CSU");
        eventItem.append("div")
              .attr("class", "col-md-1")
          .style("text-align", "right")
          .text("ID");
        eventItem.append("div")
              .attr("class", "col-md-1")
          .style("text-align", "left")
          .text("CDD");
        eventItem.append("div")
              .attr("class", "col-md-1")
          .style("text-align", "left")
          .text("R20mm");    


        //Extreme Events table -- row values
        var pointIds = idGrouping.all();
        for (var i = 0; i < pointIds.length; i++) {       
          var eventItem = d3.select("#eventsList")
                .append("div")
                .attr("class", "eventItem row")
                .style("text-align", "left")                
                .attr("id", (i+1).toString())
                .on('click', popupfromlist);
          eventItem.append("div")
                .attr("class", "col-md-1")                         
                .style("text-align", "left")
                .attr("title", "#"+(i+1).toString())
                .text("#"+(i+1).toString());
          eventItem.append("div")
                .attr("class", "col-md-2")
                .style("text-align", "left")
                .attr("title", points[i].Region)
                .text(points[i].Region);             
          eventItem.append("div")
                .attr("class", "col-md-3")
                .style("text-align", "left")
                .attr("title", points[i].Type)
                .text(points[i].Type);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "left")
                .attr("title", points[i].Year)  
                .text(points[i].Year);
          eventItem.append("div")
                .attr("class", "col-md-2")
                .style("text-align", "right")
                .attr("title", points[i].Season)
                .text(points[i].Season);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .attr("title", points[i].CSU)
                .text(points[i].CSU);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .attr("title", points[i].ID)
                .text(points[i].ID);          
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .attr("title", points[i].CDD)                  
                .text(points[i].CDD);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .attr("title", points[i].R20mm)        
                .text(points[i].R20mm);
        }
}

function updateList() {
  var pointIds = idGrouping.all();
  for (var i = 0; i < pointIds.length; i++) {
    if (pointIds[i].value > 0)
   $("#"+(i+1)).show();
    else
   $("#"+(i+1)).hide();
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
  markerGroup.zoomToShowLayer(m, function () {
        map.setView(new L.LatLng(lat,lng), 6);  // added to handle single marker
        m.openPopup();
      });
  var container = $("#eventsList");
  var scrollTo = $("#" + this.id);
  container.scrollTop( scrollTo.offset().top - container.offset().top + container.scrollTop() );
  //$(".eventItem").css("font-weight", "normal"); //bolds the text in the selected row
  $(".eventItem").css("background-color", "#ffffff"); //remove highlight
  //$("#"+this.id).css("font-weight", "bold"); //bolds the text in the selected row
  $("#"+this.id).css("background-color", "#F7FE2E"); //highlights row
}