var data;
var index = 0;
var interval = 6;

function load_csv(url) {
  d3.csv(url, function(error, dataset) {
    data = dataset;
    var s1 = new p5(overall_goldstein);
    set_main_text();
    //advance();
  });
}

var overall_goldstein = function(s) {
  var w = 1200, h = 100;

  s.setup = function() {
    s.createCanvas(w, h);
  };

  s.draw = function() {
    s.background(255);

    s.translate(-s.millis()/100, 0);
    
    s.noFill();

    s.stroke(0);
    s.beginShape();
    for (var i = 0; i < data.length; i++){
      s.vertex(s.map(data[i].num, 0, data.length, 0, w*100), s.map(data[i].goldstein_score, -10, 10, 0, h));
    }
    s.endShape();

    s.stroke(255, 0, 0);
    s.beginShape();
    for (var i = 0; i < data.length; i++){
      s.vertex(s.map(data[i].num, 0, data.length, 0, w*100), s.map(data[i].polarity, -1, 1, 0, h));
    }
    s.endShape();

    s.stroke(0, 0, 255);
    s.beginShape();
    for (var i = 0; i < data.length; i++){
      s.vertex(s.map(data[i].num, 0, data.length, 0, w*100), s.map(data[i].modality, -1, 1, 0, h));
    }
    s.endShape();

    s.stroke(0, 255, 0);
    s.beginShape();
    for (var i = 0; i < data.length; i++){
      s.vertex(s.map(data[i].num, 0, data.length, 0, w*100), s.map(data[i].subjectivity, 0, 1, 0, h));
    }
    s.endShape();

    s.noStroke();
    s.fill(255, 0, 0);
    s.ellipse(s.map(data[index].num, 0, data.length, 0, w*100), s.map(data[index].goldstein_score, -10, 10, 0, h), 5, 5);

    if (s.frameCount % interval == 0) {
      set_main_text();
      index ++;
      if (index >= data.length) index = 0;
    }
  }
};

function set_main_text() {
  var main_text = d3.select('body').select('#main-text').text('');
  var actor1 = data[index].actor1, actor2 = data[index].actor2;
  if (typeof country_codes[actor1] != 'undefined') actor1 = country_codes[actor1];
  if (typeof country_codes[actor2] != 'undefined') actor2 = country_codes[actor2];
  main_text.append('p').text('Actor: ' + actor1);
  main_text.append('p').text('Event: ' + data[index].event_description.replace(', not specified below', ''));
  main_text.append('p').text('Victim: ' + actor2);
  main_text.append('p').text('Original: ' + data[index].orignal_text);

}

function advance() {
  index ++;
  if (index >= data.length) index = 0;
  setTimeout(advance, interval);
}

function filter(column, val) {
  return data.filter(function(item){
    item.column == val;
  });
}


load_csv('war_peace_sentiment.csv');
