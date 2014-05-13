var utils = require('./utils');
var config = require('./config');
var request = require('request');
var cheerio = require('cheerio');

function Torrent(params) {
  this.id = params.id;
  this.title = params.title;
  this.category = params.category;
  this.url = this._url();
  this.magnet = params.magnet;
  this.seeders = params.seeders;
  this.leechers = params.leechers;
  this.uploader = params.uploader;
  this.files = params.files;
  this.bytes = params.size;
  this.date = params.date;
  this.comments = params.comments;
  this.hash = params.hash;

  this.size = this._size();
}

Torrent.prototype._size = function() {
  return utils.convertBytesToMegabytes(this.bytes)
};

Torrent.prototype._url = function() {
  return config.base_url + '/torrent/' + this.id
};

// Return a Torrent object from a corrosponding ID
Torrent.find_by_id = function(id, callback) {
  var url = config.base_url + '/torrent/' + encodeURIComponent(id)
  var self = this;

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var results = self.parse_torrent_page(body);

      // Add ID into results hash
      results.id = id;

      callback(new Torrent(results));
    } else {
      callback(error, response);
    }
  });
};

Torrent.parse_torrent_page = function(html) {
  $ = cheerio.load(html);
  var row = $('#detailsframe');

  var results = {
    'title': $('#title', row).text().trim(),
    'category': parseInt(/(\d{3})$/g.exec($('dd a', row).eq(0).attr('href'))[1]),
    'files': parseInt($('dd a', row).eq(1).text()),
    'size': parseInt(/\((\d+).+\)/g.exec($('dd', row).eq(2).text())[1]),
    'date': new Date($('.col2 dd', row).eq(0).text()), // Parse Time
    'uploader': $('dd', row).eq(5).text().trim(),
    'seeders': parseInt($('dd', row).eq(6).text()),
    'leechers': parseInt($('dd', row).eq(7).text()),
    'comments': parseInt($('#NumComments', row).text().trim()),
    'hash': $('dl', row).text().split("\n").pop().trim(),
    'magnet': $('div.download', row).eq(0).children("a").eq(0).attr('href')
  }

  return results;
};

module.exports = Torrent;