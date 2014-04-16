#!/usr/bin/env node

var path       = require('path'),
    fs         = require('fs'),
    http       = require('http'),
    htmlparser = require('htmlparser2'),
    _          = require('lodash'),
    rootPath   = path.normalize(__dirname + '/..'),
    config     = require(rootPath + '/server/config/config'),
    mongoose   = require('mongoose'),
    Match      = require(rootPath + '/server/models/match.js'),
    timer, pending = 0;

// I load the models for populate the records
require(rootPath + '/server/models/team.js');
require(rootPath + '/server/models/teams_matches.js');

/*
 * DB
 */
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function(err) {
  console.error('connection error:' + err);
  if (timer)
    clearTimeout(timer);
});
db.once('open', function callback () {
  console.log('connexion db opened');
  // Launch the daemon
  getHtmlPage(fetchScores);
});

/**
 * Function for relaunch the daemon
 */
var launchTimeout = function() {
  timer = setTimeout(getHtmlPage, 30 * 60 * 1000, fetchScores);
};

/**
 * Function to find a specific node
 *
 * @param {Object{}} nodes    - The array of nodes
 * @param {String}   nodeType - The type of node (tag, text, etc...)
 * @param {String}   nodeName - The node name (div, span, a, etc...)
 * @param {String}   attribName - The attribute name (class, id, etc...)
 * @param {String}   attribValue - The attribute value
 * @param {Object}   options     - The other options (index, recursive)
 *
 * @return {Object} {node, index}
 */
var fetchNode = function(nodes, nodeType, nodeName, attribName, attribValue, options) {
  console.log('fetchNode: ' + nodeName);
  var defaultOptions = {
    index: 0,
    recursive: false
  };
  var node;
  options = _.extend(defaultOptions, options || {});
  for (var i = options.index; i < nodes.length; ++i) {
    if (nodes[i].type !== nodeType || (!options.recursive && nodes[i].name !== nodeName)) {
      continue;
    }
    // I search a node with a specific attribute
    if (nodes[i].hasOwnProperty('attribs') && nodes[i].attribs.hasOwnProperty(attribName) &&
      nodes[i].attribs[attribName] === attribValue)
    {
      return {node: nodes[i], index: i};
    }
    // Else if recursive is true, I search in a deep
    else if (options.recursive && nodes[i].hasOwnProperty('children')) {
      node = fetchNode(nodes[i].children, nodeType, nodeName, attribName, attribValue, options);
      // If found, I return the node
      if (null !== node) {
        node.index = i;
        return node;
      }
    }
  }
  // Else I return null
  return null;
}

/**
 * Request the HTML page and parse the result for return the node DIV of match-list
 *
 * @param {Function} done - callback function (err, nodes)
 */
var getHtmlPage = function(done) {
  console.log('getHtmlPage: ' + pending);
  // No more requests in same time
  if (pending > 0) {
    return;
  }
  pending = 1;

  var handler = new htmlparser.DomHandler(function (error, nodes) {
    if (error)
      return done(error);
    else {
      var i = 0;
      // Find the root node of the match list
      var row = fetchNode(nodes, 'tag', 'div', 'class', 'row');
      while (row && i < 100) {
        // console.log(row.node);
        if (row.node.hasOwnProperty('children')) {
          var matchlist = fetchNode(row.node.children, 'tag', 'div', 'class', 'match-list');
          if (matchlist && matchlist.node.hasOwnProperty('children')) {
            pending--;
            return done(null, matchlist.node.children[0].children);
          }
        }
        row.index++;
        row = fetchNode(nodes, 'tag', 'div', 'class', 'row', {index: row.index});
        i++;
      }
      pending--;
      done(null, null);
    }
  });
  var parser = new htmlparser.Parser(handler);

  var options = {
    hostname: 'www.fifa.com',
    port: 80,
    path: '/worldcup/matches/index.html',
    method: 'GET'
  };
  var startTime = new Date();
  console.log('start request');
  var req = http.request(options, function(res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function() {
      console.log('end requestTime: ' + Math.round((new Date().getTime() - startTime.getTime())/1000, 2));
      parser.write(data);
      parser.end();
    });
  });
  req.on('error', function(e) {
    done(e);
  });
};

/**
 * Find the node of the matches's day
 *
 * @param {Object{}} nodes - The array of nodes
 * @param {Match}    match - The resource Match
 *
 * @return {object} The node or null
 */
var findDateMatchesNode = function(nodes, match) {
  console.log('findDateMatchesNode: ' + match.date);
  var date = match.date.getFullYear().toString();
  var month = (match.date.getMonth()+1);
  if (month < 10) {
    month = '0' + month.toString();
  }
  var day = match.date.getDate();
  // Notez la veille sur le site de la FIFA
  if (match.date.getHours() === 0) {
    day = match.date.getDate()-1;
  }
  if (day < 10) {
    day = '0' + day.toString();
  }
  date += month.toString() + day.toString();
  console.log('date: ' + date);
  // //*[@id="matchDate(YYYYMMDD)"]
  return fetchNode(nodes, 'tag', 'div', 'id', date);
};

/**
 * Find the node of the match
 *
 * @param {Object{}} nodes - The array of nodes
 * @param {Match}    match - The resource Match
 *
 * @return {object} The node or null
 */
var findMatchNode = function(nodes, match) {
  var teamHomeName = match.teamHome.team.country.toLowerCase();
  var thNode = fetchNode(nodes, 'tag', 'span', 'class', 't-nText ', {recursive: true});
  var i = 0;
  while (thNode && i < 10) {
    if (thNode.node.hasOwnProperty('children') && thNode.node.children[0].hasOwnProperty('data') &&
      thNode.node.children[0].data.toLowerCase() === teamHomeName)
    {
      // console.log(thNode.node.parent.parent.parent);
      return thNode.node.parent.parent.parent;
    }
    thNode.index++;
    i++;
    thNode = fetchNode(nodes, 'tag', 'span', 'class', 't-nText', {recursive: true, index: thNode.index});
  }
  return null;
};

/**
 * Find the score of the match
 *
 * @param {Object{}} nodes - The array of nodes
 * @param {Match}    match - The resource Match
 * @param {Function} done  - The function callback (err, score, match)
 */
var findScore = function(nodes, match, done) {
  console.log('findScore: ' + match.teamHome.team.country);

  var dateNode = findDateMatchesNode(nodes, match);
  if (null === dateNode) {
    return done('No found date node of matches');
  }
  //console.log(dateNode);
  var matchNode = findMatchNode(dateNode.node.children, match);
  if (null === matchNode) {
    return done('No found match node');
  }
  var statusNode = fetchNode(matchNode.children, 'tag', 'div', 'class', 's-status', {recursive: true});
  // Retrieve status node for check if the match is finish
  if (null === statusNode) {
    return done("Error to find status node of match " + match.teamHome.team.country + ' - ' + match.teamAway);
  }
  // Search if the match is indicated as finish
  if (statusNode.node.hasOwnProperty('children') && statusNode.node.children[0].hasOwnProperty('data') &&
    /full-time/i.test(statusNode.node.children[0].data))
  {
    // Retrieve the score of the match
    var scoreNode = fetchNode(matchNode.children, 'tag', 'span', 'class', 's-scoreText', {recursive: true});
    if (null === scoreNode) {
      return done('Error to find score node of match ' + match.teamHome.team.country + ' - ' + match.teamAway);
    }
    if (scoreNode.node.hasOwnProperty('children') && scoreNode.node.children[0].hasOwnProperty('data') &&
      /\d+\s*-\s*\d+/.test(scoreNode.node.children[0].data))
    {

      return done(null, scoreNode.node.children[0].data.replace(/\s/g, ''), match);
    }
  } else {
    console.log('Status empty');
  }
  // The match is not finish
  done(null, null, match);
};

/**
 * Save the resource Match with the score
 *
 * @param {string} err - The error if present
 * @param {string} score - The match's score
 * @param {Match}  match - The resource Match
 */
var saveMatchScore = function(err, score, match) {
  console.log('saveMatchScore: ' + score);
  if (err) {
    console.log(err);
  }
  if (null !== score) {
    var parts = score.split('-');
    match.score.home = parseInt(parts[0], 10);
    match.score.away = parseInt(parts[1], 10);
    match.save(function(err, newMatch, nbUpdated) {
      if (err) {
        console.log(err);
      } else {
        if (nbUpdated === 1) {
          // Mettre à jour le vainqueur à sa nouvelle place
          console.log('The match score is saved', newMatch);
        }
      }
    });
  } else {
    console.log('no score for the match ' + match.teamHome.team.country + ' - ' + match.teamAway);
  }
  if (pending === 0) {
    launchTimeout();
  }
  pending--;
};

/**
 * Find the match finished for retrieve their score
 *
 * @param {String} err     - A error if present
 * @param {Object{}} nodes - The nodes of matches
 */
var fetchScores = function(err, nodes) {
  console.log('fetchScores');
  if (err) {
    console.log(err);
    // TODO: Add countdown of errors
    launchTimeout();
    return;
  }
  var now = new Date(Date.now());
  Match.find({date: {$lt: now}, 'score.home': null})
    .populate('teamHome')
    .exec(function(err, matches) {
    if (err) {
      // TODO: Ajouter un compteur d'erreur simultanées
      console.log(err);
      return;
    }
    pending = matches.length;
    console.log('nb matches: ' + matches.length);
    if (matches.length > 0) {
      // A team play one match by day max then why populate other
      var opts = [
        { path: 'teamHome.team', select: 'country', model: 'Team'}
      ];
      Match.populate(matches, opts, function(err, matchesP) {
        for (var i = matchesP.length - 1; i >= 0; i--) {
          findScore(nodes, matchesP[i], saveMatchScore);
        }
      });
    } else {
      console.log(now.toString() + ': No matches found');
      launchTimeout();
    }
  });
}

/**
 * Close properly the daemon
 *
 * @param {String} msg - The final message to display
 */
var closeDaemon = function(msg) {
  if (timer)
    clearTimeout(timer);
  if (db)
    db.close();
  console.log(msg);
};
process.on('uncaughtException', function(err) {
  closeDaemon('Caught exception: ' + err);
});
process.on('SIGINT', function() {
  closeDaemon('Got SIGINT.  Press Control-D to exit.');
});
process.on('SIGHUP', function() {
  closeDaemon('Got SIGHUP.  Press Control-D to exit.');
});
process.on('exit', function() {
  closeDaemon('Process exit');
});