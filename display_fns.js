
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

  eventChart  = dc.rowChart("#chart-eventType"),

    

  eventChart
    .width(200)
    .height(200)
    .margins({top: 10, right: 10, bottom: 30, left: 10})    // Default margins: {top: 10, right: 50, bottom: 30, left: 30}.
    .dimension(eventDimension)
    .group(eventGrouping)
    .on("preRedraw",update0)
    .colors(d3.scale.category20()) 
    .elasticX(true)
    .gap(0)
    .xAxis().ticks(4);

  dc.renderAll();

}

// set visibility of markers based on crossfilter
function updateMarkers() {
  console.log('markers[1]:', markers[1]);
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
            .attr("class", "row");
        eventItem.append("div")
          .attr("class", "col-md-1")
          .text("Id");
        eventItem.append("div")
          .attr("class", "col-md-2")
          .text("Station");
        eventItem.append("div")
          .attr("class", "col-md-1")
          .style("text-align", "right")
          .text("Type");
        eventItem.append("div")
          .attr("class", "col-md-1")
          .style("text-align", "right")
          .text("Year");
        eventItem.append("div")
          .attr("class", "col-md-2")
          .style("text-align", "right")
          .text("Season");
        eventItem.append("div")
          .attr("class", "col-md-2")
          .style("text-align", "right")
          .text("Metric");
        eventItem.append("div")
              .attr("class", "col-md-3")
          .style("text-align", "right")
          .text("Statistic");

        //Extreme Events table -- row values
        var pointIds = idGrouping.all();
        for (var i = 0; i < pointIds.length; i++) {
        //for (var i = 0; i < idGrouping; i++) {  
          var eventItem = d3.select("#eventsList")
                .append("div")
                .attr("class", "eventItem row")
                .attr("id", (i+1).toString())
                .on('click', popupfromlist);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .attr("title", "#"+(i+1).toString())
                .text("#"+(i+1).toString());
          eventItem.append("div")
                .attr("class", "col-md-2")
                .attr("title", points[i].Core)
                .text(points[i].Station);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
          .style("color", "#2EA3DB")
                .attr("title", points[i].Depth)
                .text(points[i].Type);
          eventItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
          .style("color", "#F5B441")
                .attr("title", points[i].OldestDate)
                .text(points[i].Year);
          eventItem.append("div")
                .attr("class", "col-md-2")
                .style("text-align", "right")
                .attr("title", points[i].Proxy)
                .text(points[i].Season);
          eventItem.append("div")
                .attr("class", "col-md-2")
                .style("text-align", "right")
                .attr("title", points[i].Species)
                .text(points[i].Metric);
          eventItem.append("div")
                .attr("class", "col-md-3")
                .style("text-align", "right")
                .attr("title", points[i].Reference)
                .text(points[i].Statistic);
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