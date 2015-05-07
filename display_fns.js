
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

var index_types = ["CSU", "ID", "CDD", "R20mm"];
var datasets = ["Obs", "M1"];

function initCrossfilter() {
  //some housekeeping
  titles = [index for (index in points[0])]; //column titles for points obj array
  titles_obs = [titles[9], titles[10], titles[11], titles[12]]; //col titles for OBS data
  titles_M1 = [titles[13], titles[14], titles[15], titles[16]]; //col titles for M1 data

  filter = crossfilter(points);
  console.log('in initCrossfilter');

  // dimension and group for looking up currently selected markers
  idDimension = filter.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });


  var idx_CSU = [], idx_ID = [], idx_CDD = [], idx_R20mm = []; counter_CSU = 0; counter_ID = 0; counter_CDD = 0; counter_R20mm = 0;
  var indexDimension = filter.dimension(
      function(p, idx) {        
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
    
  console.log("indexDimension: ", indexDimension);
  console.log("indexGrouping: ", indexGrouping);
  console.log("indexGrouping.all(): ", indexGrouping.all());
  console.log("indexGrouping.all()[0]: ", indexGrouping.all()[0]);
  console.log("indexGrouping.all()[0].key: ", indexGrouping.all()[0].key);

  //try to filter only rows of type = CSU (days)  
  var csuDimension = filter.dimension(   
      function(p, idx) {
        //console.log("p.ObsCSU: ", p.ObsCSU);
        return p.ObsCSU;
      }
  );
  console.log("csuDimension: ", csuDimension);
  var csuGrouping = csuDimension.group();

  console.log("csuGrouping: ", csuGrouping);
  console.log("csuGrouping.all(): ", csuGrouping.all());
  console.log("csuGrouping.all()[0]: ", csuGrouping.all()[0]);
  //console.log("csuGrouping.all()[0]: ", csuGrouping.all().length);
  //console.log("csuGrouping.all()[0].key: ", csuGrouping.all()[0].key);


  //mark anaomalous years for each dataset
  markAnomalousYear(titles_obs, datasets[0], "Obs (1950-2014)"); //OBS
  markAnomalousYear(titles_M1, datasets[1], "Model M1"); //M1
  
  
  filter_obs = crossfilter(points);

  obsDimension = filter_obs.dimension(
      function(p) {        
        return p.Obs;
      });
  obsGrouping = obsDimension.group();


  // newM = {}; counter=0;
  // M1Dimension = filter_obs.dimension(
  //     function(p, idx) {
  //       if (p.M1 != "0") { newM[counter++] = p.M1;
  //       //return p.M1;           
  //       }
  //       return newM;
  //     }      
  // );
  // M1Grouping = M1Dimension.group();
  // M1Grouping.all()[0].key=M1Grouping.all()[0].key[0]; //hack
  // M1Grouping.all()[0].value=counter; //hack
  // M1Chart  = dc.rowChart("#chart-M1dataType");

  //###start stackoverflow method###
  //http://jsfiddle.net/djmartin_umich/m7V89/#base
  //http://stackoverflow.com/questions/17524627/is-there-a-way-to-tell-crossfilter-to-treat-elements-of-array-as-separate-record

  function reduceAdd(p, v) {
    // console.log("p:", p);
    // console.log("v.A:", v.A);
    // console.log("v.B:", v.B);
    // console.log("combine:", [v.A, v.B]);
    v.AnomYear = [v.A, v.B]; //make col entries into array of strings
    console.log("v.AnomYear: ", v.AnomYear); 
    if (v.AnomYear[0] === "") return p;    // skip empty values
    v.AnomYear.forEach (function(val, idx) {
      console.log("val anomYear: ", val);
      p[val] = (p[val] || 0) + 1; //increment counts
    });
    
    console.log("p anomYear:", p);
    return p;
  }

  function reduceRemove(p, v) {
    if (v.AnomYear[0] === "") return p;    // skip empty values
      v.AnomYear.forEach (function(val, idx) {
         p[val] = (p[val] || 0) - 1; //decrement counts
      });
      return p;     
  }

  function reduceInitial() {
    return {};  
  }

  var anomYearDim = filter.dimension(function(d){ return d.AnomYear;});
  var anomYearGroup = anomYearDim.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value();


  // hack to make dc.js charts work
  anomYearGroup.all = function() {
    var newObject = [];
    for (var key in this) {
      if (this.hasOwnProperty(key) && key != "all" && key != "top") {
        newObject.push({
          key: key,
          value: this[key]
        });
      }
    }
    return newObject;
  };
  console.log("anomYearGroup: ", anomYearGroup);

  anomYearGroup.top = function(count) {
    var newObject = this.all();
     newObject.sort(function(a, b){return b.value - a.value});
    return newObject.slice(0, count);
  };

  var barChart = dc.rowChart("#chart-anomYear");
    
  barChart
      .renderLabel(true)
      .height(200)
      .dimension(anomYearDim)
      .group(anomYearGroup)
      //.cap(2)
      .ordering(function(d){return -d.value;})
      .xAxis().ticks(3);

  barChart.filterHandler (function (dimension, filters) {
         dimension.filter(null);   
          if (filters.length === 0)
              dimension.filter(null);
          else
              dimension.filterFunction(function (d) {
                  for (var i=0; i < d.length; i++) {
                      if (filters.indexOf(d[i]) >= 0) return true;
                  }
                  return false;
              });
      return filters; 
      }
  );


  //###end stackoverflow method###

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
  

  dc.renderAll();

}

//check if points object Obs cols have an entry for CSU index
function markAnomalousYear(col_names, dataset, label) {
  //console.log("dataset: ", dataset);
  for (var i = 0; i < points.length; i++) {
    points[i][dataset] = "0";
    for (var j = 0; j < col_names.length; j++) {
      if (points[i][col_names[j]]) {
        points[i][dataset] = label;
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