// TODO: loading image
// TODO: range handler
// TODO: modularize each SVG section

var AudioSampleRange = (function(sampleRate) {
  if (sampleRate == undefined)
    throw new Exception();
  return {
    getSampleFromTime: function(begin, end) {
      return {begin:begin*sampleRate, end:end*sampleRate};
    },
    getTimeFromSample: function(begin, end) {
      return {begin:begin/sampleRate, end:end/sampleRate};
    }
  }
})(44100);

var AudioVisualizer = (function() {
  var ns = 'http://www.w3.org/2000/svg';
  var OVERVIEW_HEIGHT = 50;
  var assignAttributes = function(svgElem, assignment) {
    for (var i in assignment) {
      svgElem.setAttribute(i, assignment[i]);
    }
  };

  var VisualizerOverview = function(svg, data, order, offset) {
    this.svg = svg;
    this.group = null;
    this.selection = null;
    this.separator = null;
    this.handlerL = null;
    this.handlerR = null;
    this.data = data;
    this.length = data.length;
    this.height = OVERVIEW_HEIGHT;
    this.absHeight = this.height / 2 | 0;
    this.offsetHeight = offset + this.height * order;

    this.group = document.createElementNS(ns, 'g');
    assignAttributes(this.group, {
      'transform':'translate(0,'+this.offsetHeight+')'
    });
    this.svg.appendChild(this.group);

    this.selection = document.createElementNS(ns, 'rect');
    assignAttributes(this.selection, {
      'x':0, 'y':0, 'width':'100%', 'height':this.height,
      'fill':'#eeeeee', 'stroke':'none', 'stroke-width':1
    });
    this.group.appendChild(this.selection);

    var separator = document.createElementNS(ns, 'line');
    assignAttributes(separator, {
      'x1':0, 'y1':this.height,
      'x2':'100%', 'y2':this.height,
      'fill':'none', 'stroke':'black', 'stroke-width':1
    });
    this.group.appendChild(separator);
/*
    var handlerL = document.createElementNS(ns, 'rect');
    assignAttributes(handlerL, {
      'x': 0, 'y':0,
      'width':5, 'height':this.height,
      'fill':'none', 'stroke':'black', 'stroke-width':1
    });
    this.group.appendChild(handlerL);

    var handlerR = document.createElementNS(ns, 'rect');
    assignAttributes(handlerR, {
      'x': this.svg.width.baseVal.value, 'y':0,
      'width':5, 'height':this.height,
      'fill':'none', 'stroke':'black', 'stroke-width':1
    });
    this.group.appendChild(handlerR);
*/
    this.drawWave();
  };
  VisualizerOverview.prototype = {
    drawSelection: function(begin, end) {
      var maxWidth = this.svg.width.baseVal.value;
      var x = begin / this.length * maxWidth | 0;
      var width = (end / this.length * maxWidth | 0) - x;
      if (width > 0) {
        assignAttributes(this.selection, {
          'x':x, 'width':width
        });
      }
    },
    drawWave: function() {
      var maxWidth = this.svg.width.baseVal.value;
      var step = this.length / maxWidth | 0;

      var path = document.createElementNS(ns, 'path');
      var d = 'M0,'+ this.absHeight;
      for (var j = 0; j < maxWidth; j++) {
        var min, max, cursor = j * step;
        for (var k = 0; k < step; k++) {
          var subCursor = cursor + k;
          if (k === 0) min = max = this.data[subCursor];
          min = this.data[subCursor] < min ? this.data[subCursor] : min;
          max = this.data[subCursor] > max ? this.data[subCursor] : max;
        }
        d += ' '+j+','+((min * this.absHeight | 0) + this.absHeight)+
             ' '+j+','+((max * this.absHeight | 0) + this.absHeight);
      }
      assignAttributes(path, {
        'd':d, 'stroke':'black', 'stroke-width':1, 'fill':'none'
      });
      this.group.appendChild(path);
    }
  };

  var VisualizerStage = function(svg, data, height, order) {
    this.svg = svg;
    this.group = null;
    this.wave = null;
    this.data = data;
    this.length = data.length;
    this.height = height;
    this.absHeight = height / 2 | 0;
    this.offsetHeight = height * order;
    this.wave = null;

    this.group = document.createElementNS(ns, 'g');
    assignAttributes(this.group, {
      'transform':'translate(0,'+this.offsetHeight+')'
    });
    this.svg.appendChild(this.group);

    var separator = document.createElementNS(ns, 'line');
    assignAttributes(separator, {
      'x1':0, 'y1':this.height,
      'x2':'100%', 'y2':this.height,
      'fill':'none', 'stroke':'black', 'stroke-width':1
    });
    this.group.appendChild(separator);

    var zeroLine = document.createElementNS(ns, 'line');
    assignAttributes(zeroLine, {
      'x1':0, 'y1':this.absHeight,
      'x2':'100%', 'y2':this.absHeight,
      'stroke':'gray', 'fill':'none', 'stroke-width':1
    });
    this.group.appendChild(zeroLine);
    this.drawWave(0, this.length);
  };
  VisualizerStage.prototype = {
    drawWave: function(begin, end) {
      var maxWidth = this.svg.width.baseVal.value;
      begin = begin < 0 ? 0 : begin > (this.length - maxWidth) ? (this.length - maxWidth) : begin;
      end = end > this.length ? this.length : end < (begin + maxWidth) ? (begin + maxWidth) : end;
      begin = begin > (end - maxWidth) ? (end - maxWidth) : begin;
      var length = end - begin;
      var step = length / maxWidth | 0;

      this.wave = this.wave || document.createElementNS(ns, 'path');
      var d = 'M0,'+ this.absHeight;
      for (var j = 0; j < maxWidth; j++) {
        var min, max, cursor = j * step + begin;
        for (var k = 0; k < step; k++) {
          var subCursor = cursor + k;
          if (k === 0) min = max = this.data[subCursor];
          min = this.data[subCursor] < min ? this.data[subCursor] : min;
          max = this.data[subCursor] > max ? this.data[subCursor] : max;
        }
        d += ' '+j+','+((min * this.absHeight | 0) + this.absHeight)+
             ' '+j+','+((max * this.absHeight | 0) + this.absHeight);
      }
      assignAttributes(this.wave, {
        'd':d, 'stroke':'black', 'stroke-width':1, 'fill':'none'
      });
      this.group.appendChild(this.wave);
    }
  };

  var AudioVisualizer = function(width, height) {
    this.audioData = [];
    this.audioLength = 0;
    this.overview = [];
    this.stage = [];
    this.selectStart = 0;
    this.selectEnd = 0;

    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);

    this.refresh();
  };
  AudioVisualizer.prototype = {
    getSVG: function() {
      return this.svg;
    },
    refresh: function() {
      var length = this.svg.childNodes.length;
      for (var i = 0; i < length; i++) {
        var child = this.svg.childNodes[0];
        this.svg.removeChild(child);
      }

      var rect = document.createElementNS(ns, 'rect');
      assignAttributes(rect, {
        'x':0, 'y':0, 'width':'100%', 'height':'100%',
        'fill':'none', 'stroke':'black'
      });
      this.svg.appendChild(rect);
    },
    load: function(buffer) {
      this.refresh();

      this.audioData = new Array(buffer.numberOfChannels);
      this.audioLength = buffer.length;
      var width = parseInt(this.svg.getAttribute('width'));
      var height = parseInt(this.svg.getAttribute('height'));
      var overviewOffset = height - (OVERVIEW_HEIGHT * this.audioData.length);
      var stageHeight = (height - (OVERVIEW_HEIGHT * this.audioData.length)) / this.audioData.length;
      var absHeight = stageHeight / 2 | 0;
      for (var i = 0; i < this.audioData.length; i++) {
        this.audioData[i] = buffer.getChannelData(i);
        this.overview[i] = new VisualizerOverview(this.svg, this.audioData[i], i, overviewOffset);
        this.stage[i] = new VisualizerStage(this.svg, this.audioData[i], stageHeight, i);
      }
    },
    drawByRange: function(begin, end) {
      for (var i in this.audioData) {
        this.stage[i].drawWave(begin, end);
        this.overview[i].drawSelection(begin, end);
      }
    },
    drawByZoom: function(begin, zoom) {
      var end = begin + (this.audioLength * (100 - zoom) / 100 | 0);
      this.svg.removeChild(this.svg.childNodes[0]);
      for (var i in this.audioData) {
        this.stage[i].drawWave(this.audioData[i], begin, end);
      }
    }
  };

  return function(width, height) {
    return new AudioVisualizer(width, height);
  };
})();
