var index;
var interval = 4000;
var data;
var timeout;
var csvs = ['csv/war_peace_sentiment.csv', 'csv/magic_mountain.csv'];
var books = [{title: 'War and Peace', author: 'Leo Tolstoy'}, {title: 'Magic Mountain', author: 'Thomas Mann'}]
var csv_index = 0;
var visualizers = [];

/*
 *
 * Loads a csv from a url, sets up visualizers
 *
 */

function load_csv(url) {
  d3.csv(url, function(error, dataset){
    // save the data globally. FUCK IT
    data = dataset;
    index = 0;
    clearTimeout(timeout);
    d3.select('#book-title').text(books[csv_index].title);
    d3.select('#author').text(books[csv_index].author);

    if (visualizers.length == 0) {
      // add any visualizers here
      // each visualizer MUST have an "update" function
      visualizers.push(new GlobalGoldstein());
      visualizers.push(new SentimentBar('#sentiment .bar-holder', 'polarity', 100, 298, 25));
      visualizers.push(new HorizontalBar('#subjectivity .bar-holder', 'subjectivity', 100, 298, 25));
      visualizers.push(new HorizontalBar('#modality .bar-holder', 'modality', 100, 298, 25));
      visualizers.push(new TextFromColumn('#goldstein-number', 'goldstein_score'));
      visualizers.push(new VerticalBar('#goldstein-bar', 'goldstein_score', 20, 54, 600));
      visualizers.push(new MainText());
    }

    // start the animation
    advance();
  });
}


/*
 *
 * Advances to the next data item
 *
 */

function advance() {
  // refresh all the visualizers
  visualizers.forEach(function(v) {
    v.update();
  });

  // go to the next data item
  index ++;
  if (index >= data.length) index = 0;

  // rinse and repeat
  timeout = setTimeout(advance, interval);
}


/*
 *
 * GlobalGoldstein
 * Graph the whole novel with goldstein score over time
 *
 */

function GlobalGoldstein() {
  this.margin = {top: 20, right: 10, bottom: 20, left: 10};
  this.width = 640 - this.margin.left - this.margin.right;
  this.height = 150 - this.margin.top - this.margin.bottom;

  var x = this.x = d3.scale.linear().range([0, this.width*80]);
  var y = this.y = d3.scale.linear().range([this.height, 0]);

  this.x.domain([1, data.length+1]);
	this.y.domain([-10.0, 10.0]);

  this.line = d3.svg.line()
    .x(function(d) { return x(+d.num); })
    .y(function(d) { return y(+d.goldstein_score); });

  this.svg = d3.select('#overall-goldstein')
    .append('svg')
    .attr('class', 'global-goldstein')
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  this.svg.append('g')
    .attr('class', 'holder')
    .attr('transform', 'translate(25,0)')

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-this.width)
    .tickFormat(function(d) { return d; });

  this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(20,0)")
      .call(yAxis)

  this.svg.select('g.holder').append('path')
    .datum(data.slice(0, 80))
		.attr('class', 'line')
		.attr('d', this.line);

  this.circle = this.svg.select('g.holder').append('circle')
    .data([data[index]])
    .attr('class', 'position-marker')
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})
    .attr('r', 5)
    .attr('fill', 'red')
}

GlobalGoldstein.prototype.update = function() {
  var x = this.x;
  var y = this.y;

  if (index > 65) {
    this.svg.select('g.holder')
      .transition()
      .delay(interval)
      .duration(interval/2)
      .attr('transform', 'translate('+x(index-65)*-1+',0)')

    this.svg.select('path')
      .datum(data.slice(index-65, index+15))
      .attr('d', this.line)
  } else {
    this.svg.select('path')
      .datum(data.slice(0, 80))
      .attr('d', this.line)

    this.svg.select('g.holder')
      .attr('transform', 'translate(20,0)')
  }

  this.svg.select('circle').data([data[index]])
    .transition()
    .duration(interval/2)
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})
};

//End GlobalGoldstein


function HorizontalBar(selector, column, max_bars, width, height) {
  this.width = width;
  this.height = height;
  this.column = column;
  this.max_bars = max_bars;
  var min = this.min = d3.min(data, function(d) { return +d[column] });
  var max = this.max = d3.max(data, function(d) { return +d[column] });
  var padding = this.padding = 2;

  this.svg = d3.select(selector)
    .append('svg')
      .attr('class', 'horizontal-bar')
      .attr('width', this.width)
      .attr('height', this.height)

  var x = this.x = d3.scale.linear().range([0, max_bars]).domain([min, max]);

  this.color = d3.scale.linear()
    .domain([0, max_bars])
    .range(["#ff9999", "#00ff00"]);
}

HorizontalBar.prototype.data = function() {
  var items = []
  for (var i = 0; i < this.x(+data[index][this.column]); i++) {
    items.push(+data[index][this.column])
  }
  return items;
}

HorizontalBar.prototype.update = function() {
  var x = this.x;
  var width = this.width;
  var max_bars = this.max_bars;
  var color = this.color;
  var dset = this.data();

  var rects = this.svg.selectAll('rect').data(dset)

  var previous = 0;
  if (index > 0) previous = x(data[index-1][this.column])

  rects.enter()
    .append('rect')
    .attr('width', 0)
    .attr('height', this.height)
    .attr('y', 0)
    .attr('x', previous * width/max_bars)
    .attr('width', width/max_bars - this.padding)
    //.attr('x', function(d, i) { return i * width/max_bars })
    .attr('fill', function(d, i) { return color(i) })

  rects.transition().duration(interval/2)
    //.attr('width', width/max_bars - this.padding)
    .attr('x', function(d, i) { return i * width/max_bars })

  //var rects = this.svg.selectAll('rect').data(this.data()).exit().transition().remove()
  //rects.exit().remove()
  rects.exit()
    .transition()
    .duration(interval/3)
    .attr('x', dset.length * width/max_bars)
    .remove()
};

var SentimentBar = function(selector, column, max_bars, width, height) {
  HorizontalBar.apply(this, arguments);
  this.color = d3.scale.linear()
    .domain([0, this.max_bars])
    .range(["#0000ff", "#ff0000"]);
}
SentimentBar.prototype = Object.create(HorizontalBar.prototype);
SentimentBar.prototype.constructor = SentimentBar;


function VerticalBar(selector, column, max_bars, width, height) {
  this.width = width;
  this.height = height;
  this.column = column;
  this.max_bars = max_bars;
  var min = this.min = d3.min(data, function(d) { return +d[column] });
  var max = this.max = d3.max(data, function(d) { return +d[column] });
  var padding = this.padding = 2;

  this.svg = d3.select(selector)
    .append('svg')
      .attr('class', 'vertical-bar')
      .attr('width', this.width)
      .attr('height', this.height)

  var y = this.y = d3.scale.linear().range([0, max_bars]).domain([min, max]);

  this.color = d3.scale.linear()
    .domain([0, max_bars])
    .range(["#ff9999", "#00ff00"]);
}

VerticalBar.prototype.data = function() {
  var items = []
  for (var i = 0; i < this.y(+data[index][this.column]); i++) {
    items.push(+data[index][this.column])
  }
  return items;
}

VerticalBar.prototype.update = function() {
  var x = this.x;
  var y = this.y;
  var width = this.width;
  var height = this.height;
  var max_bars = this.max_bars;
  var color = this.color;
  var dset = this.data();

  var rects = this.svg.selectAll('rect').data(dset)

  var previous = 0;
  if (index > 0) previous = y(data[index-1][this.column])

  rects.enter()
    .append('rect')
    .attr('width', this.width)
    .attr('height', 0)
    .attr('x', 0)
    .attr('y', height - previous * height/max_bars)
    .attr('height', height/max_bars - this.padding)
    .attr('fill', function(d, i) { return color(i) })

  rects.transition().duration(interval/2)
    .attr('y', function(d, i) { return height - i * height/max_bars })

  rects.exit()
    .transition()
    .duration(interval/4)
    .attr('y', height - dset.length * height/max_bars)
    .remove()
};

/*
 * MainText()
 * Main text visualizer
 * Shows text for actors and events
 *
 */

function MainText() {
  //nothing to do here
}

MainText.prototype.update = function() {
  //var main_text = d3.select('body').select('#main-text').text('');

  var actor1 = data[index].actor1,
      actor2 = data[index].actor2;

  if (typeof country_codes[actor1] != 'undefined') actor1 = country_codes[actor1];
  if (typeof country_codes[actor2] != 'undefined') actor2 = country_codes[actor2];

  actor1 = actor1.replace(/"/g, '').toUpperCase();
  actor2 = actor2.replace(/"/g, '').toUpperCase();

  d3.select('#main-text .actor .main-text-value').text(actor1);
  d3.select('#main-text .victim .main-text-value').text(actor2);
  d3.select('#main-text .event .main-text-value').text(data[index].event_description.replace(', not specified below', '').toUpperCase());
  var text = data[index].orignal_text;
  text = text.replace(new RegExp('\\b' + actor1 + '\\b', 'gi'), '<b class="actor">' + actor1 + '</b>');
  text = text.replace(new RegExp('\\b' + actor2 + '\\b', 'gi'), '<b class="victim">' + actor2 + '</b>');
  d3.select('#full-text').html(text);
};

// end main text visualizer


function ActorGraph () {
}


ActorGraph.prototype.update = function() {
  var actor_data = filter('actor1', data[index].actor1);
}

/**
 *
 * Show value from a single column
 *
 */
function TextFromColumn(selector, column) {
  this.column = column;
  this.el = d3.select(selector)
    .append('div')
    .attr('class', 'column-text');
}

TextFromColumn.prototype.update = function() {
  this.el.text(data[index][this.column])
}

// end TextFromColumn


function filter(column, val) {
  return data.filter(function(item){
    return item[column] === val;
  });
}

function search(column, val) {
  return data.filter(function(item){
    return item[column].toLowerCase().indexOf(val.toLowerCase()) > -1;
  });
}

function next_csv() {
  csv_index ++;
  if (csv_index >= csvs.length) csv_index = 0;
  load_csv(csvs[csv_index]);
}


d3.select('#speed').attr('value', interval).on('change', function(e){
  interval = this.value;
  clearTimeout(timeout);
  advance();
});

load_csv(csvs[0]);

var socket = io('http://localhost');
socket.emit('start', 'connectme!');

socket.on('pot', function (data) {
  console.log(data);
});

socket.on('button', function (data) {
  next_csv();
  console.log(data);
});

socket.on('key', function (data) {
  console.log(data);
});
