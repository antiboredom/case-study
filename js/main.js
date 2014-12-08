var index;
var interval = 4000;
var data;
var timeout;
var csvs = ['csv/war_peace_sentiment.csv', 'csv/magic_mountain.csv', 'csv/man_without_qualities.csv'];
var books = [
  {src: 'csv/war_peace3.csv', title: 'War and Peace', author: 'Leo Tolstoy'}, 
  {src: 'csv/rainbow.csv', title: 'Gravity\'s Rainbow', author: 'Thomas Pynchon'}, 
  {src: 'csv/middlemarch.csv', title: 'Middlemarch', author: 'George Eliot'}, 
  {src: 'csv/magic_mountain.csv', title: 'Magic Mountain', author: 'Thomas Mann'}, 
  {src: 'csv/man_without_qualities.csv', title: 'The Man Without Qualities', author: 'Robert Musil'}
];
var csv_index = 0;
var visualizers = [];
var ready = false;

/*
 *
 * Loads a csv from a url, sets up visualizers
 *
 */

var datasets = [];

function preload() {
  var total = books.length;
  for (var i = 0; i < books.length; i++) {
    load_it(i, function() {
      total --;
      if (total == 0) {
        ready = true;
        d3.select('#splash').text('> ready _');
      }
    });
  }
}

function load_it(i, cb) {
  d3.csv(books[i].src, function(error, d){
    books[i].data = d;
    cb();
  });
}

function switch_book(i) {
  if (!ready) return false;
  if (!books[i].data) {
    preload();
  }
  d3.select('#splash').style('display', 'none');

  data = books[i].data;
  index = 0;

  clearTimeout(timeout);
  d3.select('#book-title').text(books[i].title);
  d3.select('#author').text("by " + books[i].author);

  if (visualizers.length == 0) {
    // add any visualizers here
    // each visualizer MUST have an "update" function
    visualizers.push(new GlobalGoldstein());
    visualizers.push(new HorizontalBar('#gold .bar-holder', 'goldstein_score', 20, 298, 25, true));
    visualizers.push(new HorizontalBar('#sentiment .bar-holder', 'polarity', 100, 298, 25));
    visualizers.push(new HorizontalBar('#subjectivity .bar-holder', 'subjectivity', 100, 298, 25));
    visualizers.push(new HorizontalBar('#modality .bar-holder', 'modality', 100, 298, 25));
    visualizers.push(new TextFromColumn('#goldstein-number', 'goldstein_score'));
    visualizers.push(new VerticalBar('#goldstein-bar', 'goldstein_score', 20, 54, 600));
    visualizers.push(new TextFromColumn('#percent', 'num', function(){
      return (100 * (+data[index].num) / data.length).toFixed(5) + '%';
    }));
    //visualizers.push(new ActorGoldstein('#actor-goldstein', 'actor1', 500, 50));
    //visualizers.push(new ActorGoldstein('#victim-goldstein', 'actor2', 500, 50));
    visualizers.push(new MainText());
    var powerGauge = gauge('#power-gauge', {
      size: 300,
      clipWidth: 300,
      clipHeight: 160,
      ringWidth: 60,
      maxValue: 10,
      minValue: -10,
      transitionMs: 4000,
    });
    powerGauge.render();
    visualizers.push(powerGauge);
  }

  // start the animation
  advance();
}

//function load_csv(url) {
  //d3.csv(url, function(error, dataset){
    //// save the data globally. FUCK IT
    //d3.select('#splash').style('display', 'none');
    //data = dataset;
    //index = 0;
    //clearTimeout(timeout);
    //d3.select('#book-title').text(books[csv_index].title);
    //d3.select('#author').text("by " + books[csv_index].author);

    //if (visualizers.length == 0) {
      //// add any visualizers here
      //// each visualizer MUST have an "update" function
      //visualizers.push(new GlobalGoldstein());
      //visualizers.push(new HorizontalBar('#gold .bar-holder', 'goldstein_score', 20, 298, 25, true));
      //visualizers.push(new SentimentBar('#sentiment .bar-holder', 'polarity', 100, 298, 25));
      //visualizers.push(new HorizontalBar('#subjectivity .bar-holder', 'subjectivity', 100, 298, 25));
      //visualizers.push(new HorizontalBar('#modality .bar-holder', 'modality', 100, 298, 25));
      //visualizers.push(new TextFromColumn('#goldstein-number', 'goldstein_score'));
      //visualizers.push(new VerticalBar('#goldstein-bar', 'goldstein_score', 20, 54, 600));
      ////visualizers.push(new ActorGoldstein('#actor-goldstein', 'actor1', 500, 50));
      ////visualizers.push(new ActorGoldstein('#victim-goldstein', 'actor2', 500, 50));
      //visualizers.push(new MainText());
    //}

    //// start the animation
    //advance();
  //});
//}


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

  this.color = d3.scale.linear()
    .domain([-10, 10])
    .range(["#ff0000", "#ffff00"]);

  this.circle = this.svg.select('g.holder').append('circle')
    .data([data[index]])
    .attr('class', 'position-marker')
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})
    .attr('r', 5)
    .attr('fill', this.color(+data[index].goldstein_score))
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
    .attr('fill', this.color(+data[index].goldstein_score))
};

//End GlobalGoldstein

function ActorGoldstein(selector, column, width, height) {
  this.column = column;
  this.selector = selector;
  var dataset = this.dataset = this.data();

  this.margin = {top: 20, right: 10, bottom: 20, left: 10};
  this.width = width - this.margin.left - this.margin.right;
  this.height = height - this.margin.top - this.margin.bottom;

  var x = this.x = d3.scale.linear().range([0, this.width]);
  var y = this.y = d3.scale.linear().range([this.height, 0]);

  this.x.domain([0, dataset.length]);
	this.y.domain([-10.0, 10.0]);

  this.line = d3.svg.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(+d.goldstein_score); });

  this.svg = d3.select(selector)
    .append('svg')
    .attr('class', 'actor-goldstein')
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  this.svg.append('g')
    .attr('class', 'holder')
    .attr('transform', 'translate(25,0)')

  //var yAxis = d3.svg.axis()
    //.scale(y)
    //.orient("left")
    //.tickSize(-this.width)
    //.tickFormat(function(d) { return d; });

  //this.svg.append("g")
      //.attr("class", "y axis")
      //.attr("transform", "translate(20,0)")
      //.call(yAxis)

  this.svg.select('g.holder').append('path')
    .datum(dataset)
		.attr('class', 'line')
		.attr('d', this.line);
}

ActorGoldstein.prototype.update = function() {
  var old_length = this.dataset.length;
  var dataset = this.dataset = this.data();

  var x = this.x = d3.scale.linear().range([0, this.width]);
  var y = this.y = d3.scale.linear().range([this.height, 0]);

  this.x.domain([0, dataset.length]);
  this.y.domain([-10.0, 10.0]);

  this.line = d3.svg.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(+d.goldstein_score); });

  if (Math.abs(dataset.length - old_length) < 100 ) {
    this.svg.select('path')
      .datum(dataset)
      .transition(interval/4)
      .attr('d', this.line)
  } else {
    this.svg.select('path')
      .datum(dataset)
      .attr('d', this.line)
  }

  d3.select(this.selector).style('display', dataset.length > 5 ? '' : 'none');
};

ActorGoldstein.prototype.data = function() {
  return filter(this.column, data[index][this.column]);
}
//End GlobalGoldstein

function HorizontalBar(selector, column, max_bars, width, height, reverse) {
  this.reverse = (typeof reverse == 'boolean' ? reverse : false);
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

  if (this.reverse === true) {
    var x = this.x = d3.scale.linear().range([0, max_bars]).domain([max, min]);
  } else {
    var x = this.x = d3.scale.linear().range([0, max_bars]).domain([min, max]);
  }

  this.color = d3.scale.linear()
    .domain([0, max_bars])
    .range(["#ffff00", "#ff0000"]);
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
  this.color = d3.scale.linear()
    .domain([10.0, -10.0])
    .range(["#ffff00", "#ff0000"]);
  //nothing to do here
}

MainText.prototype.update = function() {
  var event = data[index].event_description;
  event = event.replace(', not specified below', '').toUpperCase();

  var score = data[index].goldstein_score;
  if (+score > 0) score = '+' + score;

  var actor1 = data[index].actor1,
      actor2 = data[index].actor2;

  //var actor1_avg_goldstein = average(filter('actor1', actor1), 'goldstein_score');
  //var actor2_avg_goldstein = average(filter('actor2', actor2), 'goldstein_score');

  if (typeof country_codes[actor1] != 'undefined') actor1 = country_codes[actor1];
  if (typeof country_codes[actor2] != 'undefined') actor2 = country_codes[actor2];

  actor1 = actor1.replace(/"/g, '').toUpperCase();
  actor2 = actor2.replace(/"/g, '').toUpperCase();

  var color = this.color(parseFloat(score));
  var text = data[index].orignal_text;

  var sentences = text.match( /[^\.!\?]+[\.!\?]+/g );
  var sentence_number = data[index].sentence_number.split('_');
  var sent_index = sentence_number[sentence_number.length-1];
  var sentence = text;
  
  if (sentences) {
    for (var i = 0; i < sentences.length; i ++) {
      if (sentences[i].toUpperCase().indexOf(actor1) > -1 && sentences[i].toUpperCase().indexOf(actor2) > -1) {
        sentence = sentences[i];
        sentence = sentence.replace(new RegExp('\\b' + actor1 + '\\b', 'gi'), '<b style="background-color:#fff;color:#000" class="f_actor">' + actor1 + '</b>');
        sentence = sentence.replace(new RegExp('\\b' + actor2 + '\\b', 'gi'), '<b style="background-color:#fff;color:#000" class="f_victim">' + actor2 + '</b>');
      }
    }
  }

  text = text.replace(new RegExp('\\b' + actor1 + '\\b', 'gi'), '<b style="background-color:#fff;color:#000" class="f_actor">' + actor1 + '</b>');
  text = text.replace(new RegExp('\\b' + actor2 + '\\b', 'gi'), '<b style="background-color:#fff;color:#000" class="f_victim">' + actor2 + '</b>');

  actor1 = actor1.replace(/-/g, '');
  actor2 = actor2.replace(/-/g, '');

  d3.select('#full-text').html(sentence)
  //var text_width = d3.select('#full-text').style('width');
  //d3.select('#full-text')
    //.style('transform', 'translate(0px, 0px)')
    //.transition()
    //.duration(interval)
    //.style('transform', 'translate(-'+text_width+', 0)')

  d3.select('#main-text .actor .main-text-value').text(actor1);
  d3.select('#main-text .victim .main-text-value').text(actor2);
  //d3.select('#main-text .actor .main-text-value').text(actor1 + ' ' + actor1_avg_goldstein);
  //d3.select('#main-text .victim .main-text-value').text(actor2 + ' ' + actor2_avg_goldstein);
  //d3.select('#main-text .event .main-text-value').html('<span class="score" style="color:'+this.color(parseFloat(score))+';">'+score+'</span> ' + event);
  d3.select('#main-text .event .main-text-value').html(score + ': ' + event).transition().style('color', color);
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
function TextFromColumn(selector, column, val_cb) {
  if (typeof val_cb == 'function') {
    this.val_cb = val_cb;
  } else {
    this.val_cb = function() {
      return data[index][column];
    }
  }
  this.column = column;
  this.el = d3.select(selector)
    .append('div')
    .attr('class', 'column-text');
}

TextFromColumn.prototype.update = function() {
  this.el.text(this.val_cb())
  //this.el.text(data[index][this.column])
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

function average(array, column) {
  return d3.median(array, function(d) { return d[column] });
}

function next_csv() {
  csv_index ++;
  if (csv_index >= csvs.length) csv_index = 0;
  load_csv(csvs[csv_index]);
}

function prev_csv() {
  csv_index --;
  if (csv_index < 0) csv_index = csvs.length - 1;
  load_csv(csvs[csv_index]);
}

function next_book() {
  csv_index ++;
  if (csv_index >= books.length) csv_index = 0;
  switch_book(csv_index);
}

function prev_book() {
  csv_index --;
  if (csv_index < 0) csv_index = books.length - 1;
  switch_book(csv_index);
}


d3.select('#speed').attr('value', interval).on('change', function(e){
  change_speed(this.value);
});

function change_speed(new_interval) {
  if (ready && timeout) {
    interval = new_interval;
    clearTimeout(timeout);
    advance();
  }
}


var socket = io('http://casestudy.herokuapp.com');
socket.emit('start', 'connectme!');

var potmap = d3.scale.linear().range([30, 40000]).domain([255, 0]);

socket.on('pot', function (data) {
  console.log(data);
  var new_interval = potmap(parseInt(data.pot));
  if (Math.abs(new_interval - interval) > 50) {
    change_speed(new_interval);
  }
});

socket.on('button', function (data) {
  console.log(data);
  if (data.button == '1') {
    prev_book();
  } else if (data.button == '2') {
    next_book();
  }
});

socket.on('key', function (data) {
  console.log(data);
  //load_csv(csvs[0]);
  switch_book(0);
});

socket.on('reset', function (data) {
  d3.select('#splash').style('display', 'block');
});

preload();
