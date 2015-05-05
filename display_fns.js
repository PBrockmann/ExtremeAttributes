
//var map;
var markers = [] ;
//var markerGroup ;

var grat;

var filter;
var CSUDimension;
var CSUGrouping;
var R20mmDateDimension;
var R20mmDateGrouping;

var charts;
var domCharts;

var latDimension;
var lonDimension;
var idDimension;
var idGrouping;

var datasets = ["Obs", "M1"];
var dataset_num = [1, 2];

function initCrossfilter() {
  filter = crossfilter(points);
  console.log('in initCrossfilter');

  // dimension and group for looking up currently selected markers
  idDimension = filter.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });


  var idx_CSU = [], idx_ID = [], idx_CDD = [], idx_R20mm = []; counter_CSU = 0; counter_ID = 0; counter_CDD = 0; counter_R20mm = 0;
  var indexDimension = filter.dimension(
      function(p, idx) {
        console.log("p.Index:", p.Index);      
        if (p.Index == "CSU (days)") {                
          idx_CSU[counter_CSU] = idx;
          counter_CSU++;          
        }
        if (p.Index == "ID (days)") {                
          idx_ID[counter_ID] = idx;
          counter_ID++;          
        }
        if (p.Index == "CDD (days)") {                
          idx_CDD[counter_CDD] = idx;
          counter_CDD++;          
        }
        if (p.Index == "R20mm (mm)") {                
          idx_R20mm[counter_R20mm] = idx;
          counter_R20mm++;          
        }    
        
        return p.Index;
      });
 

  var indexGrouping = indexDimension.group();
  indexChart  = dc.rowChart("#chart-indexType");
  
  console.log("idx_CSU: ", idx_CSU);
  console.log("idx_ID: ", idx_ID);
  console.log("idx_CDD: ", idx_CDD);
  console.log("idx_R20mm: ", idx_R20mm);
  console.log("indexDimension: ", indexDimension);
  console.log("indexGrouping: ", indexGrouping);
  console.log("indexGrouping.all(): ", indexGrouping.all());
  console.log("indexGrouping.all()[0]: ", indexGrouping.all()[0]);
  console.log("indexGrouping.all()[0].key: ", indexGrouping.all()[0].key);

  //try to filter only rows of type = CSU (days)  
  var csuDimension = filter.dimension(
   
      function(p, idx) {
        console.log("p.ObsCSU: ", p.ObsCSU);
        return p.ObsCSU;
            
  });
  console.log("csuDimension: ", csuDimension);
  var csuGrouping = csuDimension.group();

  console.log("csuGrouping: ", csuGrouping);
  console.log("csuGrouping.all(): ", csuGrouping.all());
  console.log("csuGrouping.all()[0]: ", csuGrouping.all()[0]);
  console.log("csuGrouping.all()[0]: ", csuGrouping.all().length);
  //console.log("csuGrouping.all()[0].key: ", csuGrouping.all()[0].key);

  //Create a new col in points obj with values = some default string
  for (index = 0; index < points.length; ++index) {
    points[index].Obs = "normal year";
  }

  //check if points object Obs cols have an entry for CSU index
  markAnomalousYear(idx_CSU, dataset_num[0]);
  //markAnomalousYear([idx_CSU, idx_ID, idx_CDD, idx_R20mm], dataset_num[0]);
  markAnomalousYear(idx_ID, dataset_num[0]);

  // for (index = 0; index < idx_CSU.length; ++index) {
  //   if ( points[idx_CSU[index]].ObsCSU ) {
  //     points[idx_CSU[index]].Obs = "Obsservations (1950-2014)"; //1; 
  //   }
  // }
  
  filter_obs = crossfilter(points);

  obsDimension = filter_obs.dimension(
      function(p) {        
        return p.Obs;
      });
  obsGrouping = obsDimension.group();
  obsChart  = dc.rowChart("#chart-dataType");
  

  
  var nd, index, counter_CSU = 0, counter_ID = 0, counter_CDD = 0, counter_R20mm = 0;
      n_datasets = 2;
      n_CSU = []; n_ID = []; n_CDD = []; n_R20mm = []; //count number of CSU entries for OBS, M1, ..., Mn, in that order
  for (nd = 0; nd < n_datasets; ++nd) {
    for (index = 0; index < points.length; ++index) {
        if (points[index] [datasets[nd]+"-CSU"] !== "--") counter_CSU++;
        if (points[index] [datasets[nd]+"-ID"] !== "--") counter_ID++;
        if (points[index] [datasets[nd]+"-CDD"] !== "--") counter_CDD++;
        if (points[index] [datasets[nd]+"-R20mm"] !== "--") counter_R20mm++;
    }
    n_CSU[nd] = counter_CSU;
    n_ID[nd] = counter_ID;
    n_CDD[nd] = counter_CDD;
    n_R20mm[nd] = counter_R20mm;
    counter_CSU = 0, counter_ID = 0, counter_CDD = 0, counter_R20mm = 0; //clear counters
  }
  


  yearDimension = filter.dimension(
      function(p) {        
        return Math.round(p.Year);
      });
  yearGrouping = yearDimension.group();
  yearChart  = dc.barChart("#chart-eventYear");

  minYear = parseInt(yearDimension.bottom(1)[0].Year);
  maxYear = parseInt(yearDimension.top(1)[0].Year); 

  // xAxis_yearChart = yearChart.xAxis();
  // xAxis_yearChart.ticks(6);  //.tickFormat(d3.format(".0f"));

  indexChart
    .width(200) //svg width
    .height(200) //svg height
    .margins({top: 10, right: 10, bottom: 30, left: 10})    // Default margins: {top: 10, right: 50, bottom: 30, left: 30}
    .dimension(indexDimension)
    .group(indexGrouping)
    .on("preRedraw",update0)
    .colors(d3.scale.category20()) 
    .elasticX(true)
    .gap(0);

  xAxis_indexChart = indexChart.xAxis().ticks(4);

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
    .x(d3.scale.linear().domain([minYear, maxYear]))
    .xAxis().ticks(3).tickFormat(d3.format("d"));

  var yAxis_yearChart = yearChart.yAxis().ticks(6);

  obsChart
    .width(200) //svg width
    .height(200) //svg height
    .margins({top: 10, right: 10, bottom: 30, left: 10})    // Default margins: {top: 10, right: 50, bottom: 30, left: 30}
    .dimension(obsDimension)
    .group(obsGrouping)
    .on("preRedraw",update0)
    .colors(d3.scale.category20()) 
    .elasticX(true)
    .gap(0);

  dc.renderAll();

}

//check if points object Obs cols have an entry for CSU index
function markAnomalousYear(idx_indice, dataset_num) {
  for (index = 0; index < idx_indice.length; ++index) {
    if (dataset_num == 1) {
      if ( points[idx_indice[index]].ObsCSU ) {      
        points[idx_indice[index]].Obs = "Obsservations (1950-2014)"; //1;
      }
    } else if (dataset_num == 2) {
      if ( points[idx_indice[index]].M1CSU ) {
        points[idx_indice[index]].M1 = "M1";
      }
    }
  }  
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
          .attr("class", "col-md-1")
          .style("text-align", "left")
          .text("CSU");
        eventItem.append("div")
              .attr("class", "col-md-1")
          .style("text-align", "left")
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