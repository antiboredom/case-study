var index = 0;
var interval = 1000;
var data;

var width = 1500;
var height = 100;
var margin =  {top: 80, right: 80, bottom: 80, left: 80};

var	x = d3.scale.linear().range([0, width*50]);
var	y = d3.scale.linear().range([height, 0]);

var circle, svg, line;

function load_csv(url) {
  d3.csv(url, start);
}

function start(error, dataset) {
  data = dataset;

  x.domain([1, data.length+1]);
	y.domain([-10.0, 10.0]);

  line = d3.svg.line()
    .x(function(d) { return x(+d.num); })
    .y(function(d) { return y(+d.goldstein_score); });

  svg = d3.select('body')
    .append('svg')
      .attr('width', width)
      .attr('height', height)

  svg.append('g')
    .attr('class', 'holder')
    .attr('transform', 'translate(0,0)')

  svg.select('g').append('path')
    .datum(data.slice(0, 100))
		.attr('class', 'line')
		.attr('d', line);

  circle = svg.select('g').append('circle')
    .data([data[index]])
    .attr('class', 'position-marker')
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})
    .attr('r', 5)
    .attr('fill', 'red')

  advance();

}


function advance() {
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

  //if (svg.select('circle').attr('cx') > width * .75) {
  if (index > 75) {
    svg.select('g')
      .transition()
      .delay(interval)
      .duration(interval/2)
      .attr('transform', 'translate('+x(index-75)*-1+',0)')

    svg.select('path')
      .datum(data.slice(index-75, index+25))
      .attr('d', line)
  }

  svg.select('circle').data([data[index]])
    .transition()
    .duration(interval/2)
    .attr('cx', function(d){ return x(+d.num)})
    .attr('cy', function(d){ return y(+d.goldstein_score)})

  index ++;
  if (index >= data.length) index = 0;

  setTimeout(advance, interval);
}

//var lineFunction = d3.svg.line().x(x).y(y);

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

load_csv('war_peace_sentiment.csv');
