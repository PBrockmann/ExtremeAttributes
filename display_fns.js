
//var map;
var markers = [] ;
//var markerGroup ;

var grat;

var filter;

var charts;
var domCharts;

var latDimension;
var lonDimension;
var idDimension;
var idGrouping;

var index_types = ["CSU", "ID", "CDD", "R20mm"];
var datasets = ["Obs", "M1"];

function initCrossfilter() {
  

  filter = crossfilter(points);
  console.log('in initCrossfilter');
  
  d3.selectAll("#total").text(filter.size()); // total number of events
  d3.select("#active").text(filter.groupAll().value()); //total number selected       

  // dimension and group for looking up currently selected markers
  idDimension = filter.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });


  var indexDimension = filter.dimension(
      function(p) {
        return p.Index;
      });
 

  //var indexGroup = indexDimension.group();
  var indexGroup = indexDimension.group().reduceSum(function(d) {
    return d.Value;
  });
  indexChart  = dc.rowChart("#chart-indexType");
  


  anomYearDim = filter.dimension(
    function (d) {
      return d.Data; //type of dataset (e.g. Obs, M1, etc)
    });
  var anomYearGroup = anomYearDim.group().reduceSum(function(d) {
    return d.Value;
  });
  print_filter("anomYearGroup");
  anomYearChart  = dc.rowChart("#chart-anomYear");

  yearDimension = filter.dimension(
      function(p) {        
        return Math.round(p.Year);
      });
  //yearGrouping = yearDimension.group(); //counts number of years regardless of whether d.value is empty
  yearGrouping = yearDimension.group().reduceSum(function(d) {
    return d.Value;
  });
  print_filter("yearGrouping");
  yearChart  = dc.barChart("#chart-eventYear");

  minYear = parseInt(yearDimension.bottom(1)[0].Year) - 5;
  maxYear = parseInt(yearDimension.top(1)[0].Year) + 5; 

  // xAxis_yearChart = yearChart.xAxis();
  // xAxis_yearChart.ticks(6);  //.tickFormat(d3.format(".0f"));

  indexChart
    .width(200) //svg width
    .height(200) //svg height
    .margins({top: 10, right: 10, bottom: 30, left: 10})    // Default margins: {top: 10, right: 50, bottom: 30, left: 30}
    .dimension(indexDimension)
    .group(indexGroup)
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

  anomYearChart
    .width(200) //svg width
    .height(80) //svg height
    .margins({top: 10, right: 10, bottom: 30, left: 5})
    .dimension(anomYearDim)
    .group(anomYearGroup)
    .on("preRedraw",update0)
    .colors(d3.scale.category20()) 
    .elasticX(true)
    .gap(0);

  xAxis_anomYearChart = anomYearChart.xAxis().ticks(4);

  var dataTable2 = dc.dataTable("#dc-table-graph2");
  dataTable2.width(960).height(800)
    .dimension(yearDimension)
    .group(function(d) { return "Events Table2"
     })
    .size(30)
    .columns([
      function(d) { return d.Year; },
      function(d) { return d.Region; },
      function(d) { return d.Type; },
      function(d) { return d.Season; },
      function(d) { return d.Data; },
      function(d) { return d.Index; },
      function(d) { return d.Value; }
      //function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.lat + '+' + d.long +"\" target=\"_blank\">Google Map</a>"},
      //function(d) { return '<a href=\"http://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.long +'&zoom=12'+ "\" target=\"_blank\"> OSM Map</a>"}
    ])
    .sortBy(function(d){ return d.Year; })
    .order(d3.ascending);

  tableDimension = filter.dimension(
    function (d) {
      return d.Year;
  });
  var tableDimGroup = tableDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  function reduceAdd(p, v) {    
      if (v.Value) ++p.count;     
      if (v.Value) p.total += parseInt(v.Value);
      //console.log("p.total: ", p.total);
      if (p.count == 0) {
        p.average = 0;        
      } else {
          p.average = p.total / p.count;
      };
      
      return p;
    }

    function reduceRemove(p, v) {
      if (v.Value) --p.count;
      if (p.total) p.total -= parseInt(v.Value);
      if (p.count == 0) {
        p.average = 0;
      } else {
        p.average = p.total / p.count;
      };
      return p;
    }

    function reduceInitial() {
            return {
                count: 0,
                total: 0,
                average: 0
            };
    }

    var dataTable = dc.dataTable("#dc-table-graph");
    dataTable.width(960).height(800)
      .dimension(tableDimGroup)
      .group(function(d) { return "Events Table"
       })
      .size(8)
      .columns([
        function(d) { return d.key; },
        function(d) { return d.value.count; },
        function(d) { return d.value.total; },
        function(d) { return d.value.average; }
        //function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.lat + '+' + d.long +"\" target=\"_blank\">Google Map</a>"},
        //function(d) { return '<a href=\"http://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.long +'&zoom=12'+ "\" target=\"_blank\"> OSM Map</a>"}
      ])
      .sortBy(function(d){ return d.key; })
      .order(d3.ascending);



  //https://becomingadatascientist.wordpress.com/tag/crossfilter-js/
  // var cityDimensionGroup = yearDimension.group().reduce(
  //       //add
  //       function(p,v){
  //           ++p.count;
  //           p.review_sum += v.Value;  //v.review_count;        
  //           p.review_avg = p.review_sum / p.count;            
  //           return p;
  //       },
  //       //remove
  //       function(p,v){
  //           --p.count;
  //           p.review_sum -= v.Value;  //v.review_count;            
  //           p.review_avg = p.review_sum / p.count;            
  //           return p;
  //       },
  //       //init
  //       function(p,v){          
  //           return {count:0, review_sum: 0, review_avg: 0};
  //       }
  //   );

  // var dataTable2 = dc.dataTable("#dc-table-graph");
  // dataTable2.width(800).height(800)
  //   .dimension(cityDimensionGroup)
  //   .group(function(d) { return "List of all Selected Businesses"
  //    })
  //   .size(100)
  //   .columns([
  //       function(d) { return d.Year; },
  //       function(d) { return d.Region; },
  //       function(d) { return d.Type; },
  //       function(d) { return d.Season; }
  //       //function(d) { return d.review_sum; }
  //       //function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.latitude + '+' + d.longitude +"\" target=\"_blank\">Map</a>"}
  //   ])
  //   .sortBy(function(d){ return d.Year; })
  //   // (optional) sort order, :default ascending
  //   .order(d3.ascending);
 
 //Doesn't work:
 //http://www.codeproject.com/Articles/703261/Making-Dashboards-with-Dc-js-Part-3-Tips-and-Trick
  // var datatable   = dc.dataTable("#dc-table-graph");
  // var tableGroup = yearDimension.group().reduce(
  //   function reduceAdd(p,v) {
  //     p[v.Index] = v.Value;
  //     p["Year"]= v.Year;
  //     return p;
  //   },
  //   function reduceRemove(p,v) {
  //     p[v.Index] = 0;
  //     p["Year"]=v.Year;
      
  //     return p;
  //   },
  //   function reduceInitial() { return {}; }
  // ); 

  // datatable.width(960).height(800)
  //     .dimension(tableGroup)
  //     .group(function(d) {console.log("d.value.Year: ", d.value.Year); return d.value.Year;})
  //     .size(30)
  //     // dynamic columns creation using an array of closures
  //     .columns([
  //         function(d) {return d.key; },
  //         function(d) {return d.value.CSU;},
  //         function(d) {return d.value.ID;},
  //         function(d) {return d.value.CDD;},
  //         function(d) {return d.value.R20mm;}
  //         //function(d) {return d.value.http_200+d.value.http_302+d.value.http_404;}
  //     ]);
 

  dc.renderAll();

  function print_filter(filter){
    var f=eval(filter);
    if (typeof(f.length) != "undefined") {}else{}
    if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
    if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
    console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
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
  //updateMarkers();
  updateList();
  console.log("selected: ", filter.groupAll().value());
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
          .attr("class", "col-md-3")
          .style("text-align", "left")
          .text("Index");
        eventItem.append("div")
          .attr("class", "col-md-2")
          .style("text-align", "left")
          .text("Dataset");
        eventItem.append("div")
              .attr("class", "col-md-2")
          .style("text-align", "left")
          .text("#times above threshold");  


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
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .attr("title", points[i].Value)
                .text(points[i].Value);          
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