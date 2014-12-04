var index = 0;
var interval = 1000;
var data;
var timeout;
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

    // add any visualizers here
    // each visualizer MUST have an "update" function
    visualizers.push(new GlobalGoldstein());
    visualizers.push(new MainText());

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
  this.width = 1500;
  this.height = 100;
  this.margin = {top: 80, right: 80, bottom: 80, left: 80};

  var x = this.x = d3.scale.linear().range([0, this.width*50]);
  var y = this.y = d3.scale.linear().range([this.height, 0]);

  this.x.domain([1, data.length+1]);
	this.y.domain([-10.0, 10.0]);

  this.line = d3.svg.line()
    .x(function(d) { return x(+d.num); })
    .y(function(d) { return y(+d.goldstein_score); });

  this.svg = d3.select('body')
    .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)

  this.svg.append('g')
    .attr('class', 'holder')
    .attr('transform', 'translate(0,0)')

  this.svg.select('g').append('path')
    .datum(data.slice(0, 100))
		.attr('class', 'line')
		.attr('d', this.line);

  this.circle = this.svg.select('g').append('circle')
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

  if (index > 75) {
    this.svg.select('g')
      .transition()
      .delay(interval)
      .duration(interval/2)
      .attr('transform', 'translate('+x(index-75)*-1+',0)')

    this.svg.select('path')
      .datum(data.slice(index-75, index+25))
      .attr('d', this.line)
  }

  this.svg.select('circle').data([data[index]])
    .transition()
    .duration(interval/2)
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})
};

//End GlobalGoldstein


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
  var main_text = d3.select('body').select('#main-text').text('');

  var actor1 = data[index].actor1,
      actor2 = data[index].actor2;

  if (typeof country_codes[actor1] != 'undefined') actor1 = country_codes[actor1];
  if (typeof country_codes[actor2] != 'undefined') actor2 = country_codes[actor2];

  actor1 = actor1.replace(/"/g, '').toUpperCase();
  actor2 = actor2.replace(/"/g, '').toUpperCase();

  main_text.append('p').text('Actor: ' + actor1);
  main_text.append('p').text('Victim: ' + actor2);
  main_text.append('p').text('Event: ' + data[index].event_description.replace(', not specified below', '').toUpperCase());
  main_text.append('p').text('Original: ' + data[index].orignal_text);
};

// end main text visualizer


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


d3.select('#speed').attr('value', interval).on('change', function(e){
  interval = this.value;
  clearTimeout(timeout);
  advance();
});

load_csv('war_peace_sentiment.csv');
