#!/usr/bin/env node
'use strict';

var path       = require('path'),
    fs         = require('fs'),
    http       = require('http'),
    emitter    = require('events').EventEmitter,
    eventEmit  = new emitter(),
    htmlparser = require('htmlparser2'),
    _          = require('lodash'),
    rootPath   = path.normalize(__dirname + '/..'),
    config     = require(rootPath + '/server/config/config'),
    mongoose   = require('mongoose'),
    Match      = require(rootPath + '/server/models/match.js'),
    Team       = require(rootPath + '/server/models/team.js'),
    RTM        = require(rootPath + '/server/models/teams_matches.js'),
    timer,          // timer returned by setTimeout
    pending = 0,    // Nb matches being processed
    req = null,     // Object request for get HTML page
    reqPending = false,  // Request being processed
    killCalled = false,   // Boolean to clean process before exit
    simulErrors = {db:0, req:0},  // Nb simultaneous errors on DB and Request
    varDyn = {
      srcPage: 'request',         // Source of page HTML
      interval: 30 * 60 * 1000,   // Interval for timer
      date: new Date(Date.now()), // Date for find the matches
      dryrun: false               // Simulation
    };

require(process.cwd() + '/scripts/updateBets')(eventEmit);

/**
 * Format the date
 */
Date.prototype.format = function(format) {
  var addZero = function(input) {
    if (input < 10) {
      input = '0' + input.toString();
    }
    return input.toString();
  };
  var dateFormatted = '', match;
  var month = addZero(this.getMonth() + 1);
  var day = addZero(this.getDate());
  var re = /^yyyy(.)?mm.?dd/i;
  if ((match = re.exec(format)) !== null) {
    var sep = '';
    if (match[1]) {
      sep = match[1];
    }
    dateFormatted = this.getFullYear().toString() + sep + month + sep + day;
  }
  re = /(.)hh(.)?mm.?ss$/i;
  if ((match = re.exec(format)) !== null) {
    var sep = '', sepDate = '';
    if (match[1]) {
      sepDate = match[1];
      if (sepDate.toLowerCase() === 'd') {
        sepDate = '';
      }
      if (match[2]) {
        sep = match[2];
      }
    }
    var hours = addZero(this.getHours());
    var minutes = addZero(this.getMinutes());
    var seconds = addZero(this.getSeconds());
    dateFormatted += sepDate + hours + sep + minutes + sep + seconds;
  }
  return dateFormatted;
};

/**
 * Format the logs
 */
var logger = function(msg, type) {
  type = type || null;
  var args = [].slice.call(arguments);
  args = args.slice(1);
  if (type) {
    args = args.slice(1);
  }
  var now = new Date(Date.now());
  var log = now.format('YYYY-MM-DD HH:mm:ss') + ' $ ';
  if (typeof msg !== 'string') {
    msg = msg.toString();
  }
  log += msg;
  if (args.length) {
    for (var i = 0; i < args.length; i++) {
      args[i] = args[i].toString();
    }
    log += ' -- ' + args.join(' - ');
  }
  if (type === 'error') {
    log = '\x1B[40m\x1B[1;31m' + log + '\x1B[0m';
  } else if (type === 'info') {
    log = '\x1B[40m\x1B[1;33m' + log + '\x1B[0m';
  } else if (type === 'success') {
    log = '\x1B[40m\x1B[1;32m' + log + '\x1B[0m';
  }
  console.log(log);
};

/**
 * If the script is called with arguments
 */
if (process.argv.length > 2) {
  // Map of variables allowed
  var mapArgs = {
    src: {
      variable: 'srcPage',
      hasValue: true,
      eval: function(value) { return path.resolve(process.cwd(), value); }
    },
    timer: {
      variable: 'interval',
      hasValue: true,
      eval: function(value) { return parseInt(value); }
    },
    date: {
      variable: 'date',
      hasValue: true,
      eval: function(value) { return new Date(value); }
    },
    test: {
      variable: 'dryrun',
      hasValue: false,
      value: true
    }
  };

  var key, arg, value, args = process.argv, error = false;
  for (var i = 2; i < args.length; i++) {
    // I search the parameters begun with --
    if (/^--/.test(args[i])) {
      // I remove the dashes to make a key
      key = args[i].replace(/-/g, '').toLowerCase();
      // I search in map of args if the key exists
      if (mapArgs.hasOwnProperty(key)) {
        arg = mapArgs[key];
        // I check if arg requires a value and if args has other values
        if (arg.hasValue && args.hasOwnProperty(i+1)) {
          // I check that the value is not a key
          if (/^--/.test(args[i+1])) {
            console.log(key + ' require a value');
            error = true;
          }
          value = args[++i];
          // If value requires a treatment
          if (typeof arg.eval === 'function') {
            value = arg.eval(value);
          }
          // Finally, I define the value in options of this script
          varDyn[arg.variable] = value;
        }
        // args has not other values
        else if (arg.hasValue) {
          console.log(key + ' require a value');
          error = true;
        }
        // arg not requires value
        else if (arg.hasOwnProperty('value')) {
          varDyn[arg.variable] = arg.value;
        } else {
          console.log('What to do with this: ' + key);
        }
      }
      // Key unknown, isn't an error, it skip
      else {
        console.log(key + ' is unknown');
      }
    }
  }
  // I kill the process if there is an error
  if (error) {
    process.exit(1);
  }
  // I clean the variables
  delete(key, arg, value, args, error, mapArgs);
}

/*
 * DB
 */
mongoose.connect(config.db);
var db = mongoose.connection;

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
  if (!nodes) {
    logger('fetchNode: nodes empty', 'error');
    return null;
  }
  // logger('fetchNode: ' + nodeName);
  var defaultOptions = {
    index: 0,           // starting index of the loop
    recursive: false    // Research in deep
  };
  var found = null; // The node searched
  options = _.extend(defaultOptions, options || {});
  nodeType = nodeType || null;
  nodeName = nodeName || null;
  attribName = attribName || null;
  attribValue = attribValue || null;
  // if (options.recursive) {
  //   logger('fetchNode - index: ' + options.index + ' ' + attribValue);
  // }
  for (var i = options.index; i < nodes.length; ++i) {
    // If recursive is false, I skip the nodes whose type and name do not match
    if (!options.recursive && (nodes[i].type !== nodeType || nodes[i].name !== nodeName)) {
      continue;
    }
    // If the nodeName parameter is null and the type of node match, I returned
    if (nodeName === null && nodes[i].type === nodeType) {
      found = {node: nodes[i], index: i};
      break;
    } else if (attribName === null && nodes[i].type === nodeType && nodes[i].name === nodeName) {
      found = {node: nodes[i], index: i};
      break;
    }
    /*
     * I search a node with :
     *  - a type (tag, text, etc...)
     *  - a name (div, span, img, etc...)
     *  - an attribute (id, class, etc...)
     *  - and an attribute value
     */
    else if (nodes[i].type === nodeType && nodes[i].name === nodeName && nodes[i].hasOwnProperty('attribs') &&
      nodes[i].attribs.hasOwnProperty(attribName) &&
      ((typeof attribValue === 'string' && nodes[i].attribs[attribName] == attribValue) ||
        (attribValue instanceof RegExp && attribValue.test(nodes[i].attribs[attribName]))))
    {
      // logger('attrib found: ' + nodes[i].attribs[attribName] + ' - attrib search: ' + attribValue);
      found = {node: nodes[i], index: i};
      break;
    }
    // Else if recursive is true, I search in a deep
    else if (options.recursive && nodes[i].hasOwnProperty('children')) {
      // logger('fetchNode recursive: ' + nodes[i].name);
      found = fetchNode(nodes[i].children, nodeType, nodeName, attribName, attribValue, {recursive: true});
      // If I found, I return the node
      if (null !== found) {
        // I define the index of the first loop
        found.index = i;
        break;
      }
    }
  }
  return found;
};

/**
 * Return a handler for parsing the HTML page
 *
 * @param {Function} done - a callback function
 */
var getHandler = function(done) {
  var handler = new htmlparser.DomHandler(function (error, nodes) {
    if (error)
      return done(error);
    else {
      var i = 0, node = null;
      nodes = fetchNode(nodes, 'tag', 'html');
      nodes = fetchNode(nodes.node.children, 'tag', 'body');
      nodes = fetchNode(nodes.node.children, 'tag', 'div', 'id', 'wrap');
      nodes = fetchNode(nodes.node.children, 'tag', 'div', 'id', 'content-wrap');
      nodes = fetchNode(nodes.node.children, 'tag', 'div', 'class', 'container');
      // console.log(containerNode.node.children);
      // Find the root node of the match list
      var row = fetchNode(nodes.node.children, 'tag', 'div', 'class', 'row');
      while (row && i < 100) {
        // logger(row.node);
        if (row.node.hasOwnProperty('children')) {
          var matchlist = fetchNode(row.node.children, 'tag', 'div', 'class', 'matches', {recursive: true});
          if (matchlist && matchlist.node.hasOwnProperty('children')) {
            pending--;
            node = matchlist.node.children;
            break;
          }
        }
        row.index++;
        row = fetchNode(nodes.node.children, 'tag', 'div', 'class', 'row', {index: row.index});
        i++;
      }
      pending--;
      delete(i, row, matchlist);
      done(null, node);
    }
  });
  return handler;
};

/**
 * Read the file page (HTML) and parse the result for return the node DIV of match-list
 *
 * @param {Function} done - callback function (err, nodes)
 */
var getFilePage = function(done) {
  logger('getFilePage: ' + pending);
  // No more requests in same time
  if (pending > 0) {
    return;
  }
  pending = 1;

  var parser = new htmlparser.Parser(getHandler(done));

  fs.readFile(varDyn.srcPage, function(err, data) {
    if (err) {
      done(err);
    }
    parser.write(data);
    parser.end();
    parser.on('error', function(e) {
      done(e);
    });
  });
};

/**
 * Request the HTML page and parse the result for return the node DIV of match-list
 *
 * @param {Function} done - callback function (err, nodes)
 */
var requestHtmlPage = function(done) {
  logger('requestHtmlPage: ' + pending + ' (req: ' + reqPending + ')');
  // No more requests in same time
  if (pending > 0 || reqPending) {
    return;
  }
  pending = 1;
  reqPending = true;

  var parser = new htmlparser.Parser(getHandler(done));

  var options = {
    hostname: 'www.fifa.com',
    port: 80,
    path: '/worldcup/matches/index.html',
    method: 'GET',
    headers: {
      Host: 'www.fifa.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US;q=0.8,en;q=0.6',
      'Cache-Control': 'max-age=0'
    }
  };
  var startTime = new Date();
  var response;
  logger('start request');
  req = http.request(options, function(res) {
    response = res;
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function() {
      logger('end requestTime (sec): ' + Math.round((new Date().getTime() - startTime.getTime())/1000, 2));
      if (data === '' || res.statusCode > 308) {
        done('No data received from the FIFA ('+res.statusCode+')');
      } else {
        fs.writeFile('./scripts/fifa.html', data, function() {});
        parser.write(data);
        parser.end();
        // Clean request and response objects for the other requests
        simulErrors.req = 0; // counter reset
        response = null;
        reqPending = false;
      }
    });
    res.on('error', function(err) {
      logger('res error', err);
      req.abort();
      done(err);
    });
  });
  // If abort request on SIGINT event, clean request and response
  req.on('error', function(e) {
    if (req) {
      req = null;
    }
    if (response) {
      if (e.code === 'ECONNRESET' && response.socket) {
        response.socket.destroy();
      }
      response.resume();
    }
    simulErrors.req++;
    if (simulErrors.req > 5) {
      logger('Exit process after 6 simultaneous errors on request', 'error');
      process.exit(1);
    }
    done(e);
  });
  req.end();
};

/**
 * Return the node DIV of match list
 *
 * @param {Function} done - a callback function
 */
var getNodes = function(done) {
  logger('getNodes');
  if (varDyn.srcPage === 'request') {
    requestHtmlPage(done);
  } else {
    getFilePage(done);
  }
};

/**
 * Find the node of the matches's day
 *
 * @param {Object{}} nodes - The array of nodes
 * @param {Match}    match - The resource Match
 *
 * @return {object} The node or null
 */
var findDateMatchesNode = function(nodes, date) {
  logger('findDateMatchesNode: ' + date);
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
  logger('findMatchNode: ' + teamHomeName);
  var re = new RegExp('^t-nText');
  var thNode = fetchNode(nodes, 'tag', 'span', 'class', re, {recursive: true});
  var i = 0, node;
  while (thNode && i < 100) {
    if (thNode.node.hasOwnProperty('children') && thNode.node.children.length > 1) {
      node = fetchNode(thNode.node.children, 'text', null);
      while (node) {
        if (node.node.hasOwnProperty('data') && node.node.data.toLowerCase() === teamHomeName) {
          delete(teamHomeName, re, i, node);
          return thNode.node.parent.parent.parent;
        }
        node = fetchNode(thNode.node.children, 'text', null, null, null, {index: ++node.index});
      }
    }
    else if (thNode.node.hasOwnProperty('children') && thNode.node.children[0].hasOwnProperty('data') &&
      thNode.node.children[0].data.toLowerCase() === teamHomeName)
    {
      delete(teamHomeName, re, i, node);
      return thNode.node.parent.parent.parent;
    }
    thNode.index++;
    i++;
    // logger('findMatchNode index: ' + thNode.index);
    thNode = fetchNode(nodes, 'tag', 'span', 'class', re, {recursive: true, index: thNode.index});
  }
  delete(teamHomeName, re, thNode, i, node);
  return null;
};

/**
 * Find the score of the match
 *
 * @param {Object{}} nodes - The array of nodes
 * @param {Match}    match - The resource of Match
 * @param {Function} done  - The function callback (err, score, match)
 */
var findScoreOfMatch = function(nodes, match, done) {
  logger('findScoreOfMatch: ' + match.teamHome.team.country);
  var matchNode = findMatchNode(nodes, match);
  if (null === matchNode) {
    return;
    //continue;
  }
  logger('Match node found');
  var statusNode = fetchNode(matchNode.children, 'tag', 'div', 'class', 's-status', {recursive: true});
  // Retrieve status node for check if the match is finish
  if (null === statusNode) {
    done('Error to find status node of match ' + match.teamHome.team.country + ' - ' + match.teamAway.team.country);
    return;
  }
  // Search if the match is indicated as finished
  if (statusNode.node.hasOwnProperty('children') && statusNode.node.children.length > 0 &&
    statusNode.node.children[0].hasOwnProperty('data') && /full-time/i.test(statusNode.node.children[0].data))
  {
    // Retrieve the score of the match
    var scoreNode = fetchNode(matchNode.children, 'tag', 'span', 'class', 's-scoreText', {recursive: true});
    if (null === scoreNode) {
      done('Error to find score node of match ' + match.teamHome.team.country + ' - ' + match.teamAway.team.country);
      return;
    }
    if (scoreNode.node.hasOwnProperty('children') && scoreNode.node.children.length > 0 &&
      scoreNode.node.children[0].hasOwnProperty('data') && /\d+\s*-\s*\d+/.test(scoreNode.node.children[0].data))
    {
      done(null, scoreNode.node.children[0].data.replace(/\s/g, ''), match);
      delete(matchNode, statusNode, scoreNode);
    }
  } else {
    logger('Status empty');
    // The match is not finish
    done(null, null, match);
    delete(matchNode, statusNode);
  }
};

/**
 * Find the score of the matches of date
 *
 * @param {Object{}} nodes   - The array of nodes
 * @param {Date}     date    - The date of matches
 * @param {Match{}}  matches - The resources of Match
 * @param {Function} done    - The function callback (err, score, match)
 */
var findScore = function(nodes, date, matches, done) {
  logger('findScore');
  var dateNode = findDateMatchesNode(nodes, date);
  if (null === dateNode) {
    return done('No found date node of matches');
  }
  //logger(dateNode);
  logger('Date node of matches found');
  for (var i = 0; i < matches.length; i++) {
    if (varDyn.dryrun) {
      setTimeout(findScoreOfMatch, i*1000, dateNode.node.children, matches[i], done);
    } else {
      findScoreOfMatch(dateNode.node.children, matches[i], done);
    }
  }
};

var updateTeams = function(match, done) {
  logger('updateTeams');
  if (match.score.home === match.score.away && match.level < 16) {
    done('draw not allowed in this level: ' + match.level);
  } else {
    var firstTeam, secondTeam;
    if (match.score.home > match.score.away) {
      // Home wins three points
      firstTeam = {
        _id: match.teamHome.team._id,
        update : {$inc: {points: 3, played: 1, won: 1, 'goals.for': match.score.home, 'goals.against': match.score.away}}
      };
      secondTeam = {
        _id: match.teamAway.team._id,
        update : {$inc: {played: 1, lost: 1, 'goals.for': match.score.away, 'goals.against': match.score.home}}
      };
    } else if (match.score.away > match.score.home) {
      // Away wins three points
      firstTeam = {
        _id: match.teamAway.team._id,
        update : {$inc: {points: 3, played: 1, won: 1, 'goals.for': match.score.away, 'goals.against': match.score.home}}
      };
      secondTeam = {
        _id: match.teamHome.team._id,
        update : {$inc: {played: 1, lost: 1, 'goals.for': match.score.home, 'goals.against': match.score.away}}
      };
    } else {
      // All win one point, only on group stage
      firstTeam = {
        _id: match.teamHome.team._id,
        update : {$inc: {points: 1, played: 1, draw: 1, 'goals.for': match.score.home, 'goals.against': match.score.away}}
      };
      secondTeam = {
        _id: match.teamAway.team._id,
        update : {$inc: {points: 1, played: 1, draw: 1, 'goals.for': match.score.away, 'goals.against': match.score.home}}
      };
    }
    Team.findByIdAndUpdate(firstTeam._id, firstTeam.update, function(err, newFistTeam) {
      if (err) {
        done(err);
      } else {
        Team.findByIdAndUpdate(secondTeam._id, secondTeam.update, function(err, newSecondTeam) {
          done(err, match, newFistTeam, newSecondTeam);
        });
      }
    });
  }
};

/**
 * Update the relations between teams and matches for a group
 *
 * @param {Team}     firstTeam  - a resource team
 * @param {Team}     secondTeam - a resource team
 * @param {Function} done       - a callback function
 */
var updateRtmsOfGroups = function(firstTeam, secondTeam, done) {
  logger('updateRtmsOfGroups: ' + firstTeam.group);
  var group = firstTeam.group;
  // Update only if all group's teams are played all matches
  if (firstTeam.played === 3 && secondTeam.played === 3) {
    logger('all group('+firstTeam.group+') matches are finished');
    // Two teams of group go on round of 16
    Team.find({group: group, played: 3}, function(err, groupTeams) {
      logger('Get all teams of group('+group+'): ' + groupTeams.length);
      if (err) {
        logger(err, 'error');
        done(err);
      }
      // All group's matches not played
      else if (groupTeams.length !== 4) {
        logger('The matches of group('+group+') are not finish');
        done(null);
      }
      // All group's matches played, retrieve the winners
      else {
        logger('all matches of group('+group+') are finished');
        // Sort by points and return the two group's winner
        var equal = false;
        groupTeams = groupTeams.sort(function (a, b) {
          // Compare the points and the goals if two teams are equals on points
          if (a.points !== b.points) {
            return (a.points > b.points) ? 1 : -1;
          } else if (a.points === b.points && a.goals.for === b.goals.for && a.goals.against === b.goals.against) {
            equal = true;
            return 0;
          } else if (a.points === b.points && a.goals.for === b.goals.for) {
            return (a.goals.against > b.goals.against) ? 1 : -1;
          } else if (a.points === b.points) {
            return (a.goals.for > b.goals.for) ? 1 : -1;
          }
        });
        if (equal) {
          // TODO: Two teams or more are equals
          logger('Two teams or more are equals.');
        }
        groupTeams = groupTeams.slice(2);
        var firstOfGroup = groupTeams.pop();
        var secondOfGroup = groupTeams.shift();
        logger('update first team of the group('+group+'): ' + firstOfGroup.country, 'success');
        RTM.update({_id: '1'+group}, {team: firstOfGroup}, function(err) {
          if (err) {
            done(err);
          } else {
            logger('update second team of the group('+group+'): ' + secondOfGroup.country, 'success');
            RTM.update({_id: '2'+group}, {team: secondOfGroup}, done);
          }
        });
      }
    });
  } else {
    logger('The matches of group('+firstTeam.group+') are not finish');
  }
};

var updateRtmsOfSemi = function(match, firstTeam, secondTeam, done) {
  var key = match.teamHome._id + match.teamAway._id,
      updateWinner, updateLooser,
      map = {
        'W57W58': '61',
        'W59W60': '62'
      };
  if (match.score.home > match.score.away) {
    updateWinner = {team : firstTeam._id};
    updateLooser = {team : secondTeam._id};
  } else {
    updateWinner = {team : secondTeam._id};
    updateLooser = {team : firstTeam._id};
  }
  RTM.update({_id: 'W' + map[key]}, updateWinner, function(err) {
    if (err) {
      done(err);
    } else {
      RTM.update({_id: 'L' + map[key]}, updateLooser, done);
    }
  });
};

var updateRtmWinner = function(map, match, firstTeam, secondTeam, done) {
  var key = match.teamHome._id + match.teamAway._id,
      update;

  if (match.score.home > match.score.away) {
    update = {team : firstTeam._id};
  } else {
    update = {team : secondTeam._id};
  }
  RTM.update({_id: map[key]}, update, done);
};

var updateRtms = function(match, firstTeam, secondTeam, done) {
  logger('updateRtms');
  var map;
  if (match.level === 16) {
    updateRtmsOfGroups(firstTeam, secondTeam, done);
  }
  // round of 16
  else if (match.level === 8) {
    map = {
      '1A2B': 'W49',
      '1C2D': 'W50',
      '1B2A': 'W51',
      '1D2C': 'W52',
      '1E2F': 'W53',
      '1G2H': 'W54',
      '1F2E': 'W55',
      '1H2G': 'W56'
    };
    updateRtmWinner(map, match, firstTeam, secondTeam, done);
  }
  // quarter-finals
  else if (match.level === 4) {
    map = {
      'W49W50': 'W57',
      'W53W54': 'W58',
      'W51W52': 'W59',
      'W55W56': 'W60'
    };
    updateRtmWinner(map, match, firstTeam, secondTeam, done);
  }
  // semi-finals
  else if (match.level === 2) {
    updateRtmsOfSemi(match, firstTeam, secondTeam, done);
  }
  // play-off for third place and Final: nothing to do
  else {
    done(null);
  }
};

/**
 * Function for relaunch the daemon
 */
var launchTimeout = function() {
  if (!killCalled) {
    timer = setTimeout(fetchScores, varDyn.interval);
  }
};
var nbMatchesUpdated = 0;
/**
 * Save the resource Match with the score
 *
 * @param {string} err - The error if present
 * @param {string} score - The match's score
 * @param {Match}  match - The resource Match
 */
var saveMatchScore = function(err, score, match) {
  logger('saveMatchScore: ' + score);
  if (err) {
    logger(err, 'error');
    return;
  }
  if (score && match) {
    var parts = score.toString().split('-');
    match.score.home = parseInt(parts[0], 10);
    match.score.away = parseInt(parts[1], 10);
    match.save(function(err, newMatch, nbUpdated) {
      if (err) {
        logger(err, 'error');
        // Send an alert to developer
        if (--pending <= 0) {
          launchTimeout();
        }
      } else {
        logger('The match ('+newMatch.teamHome.team.country+' / '+newMatch.teamAway.team.country+') score is saved');
        if (nbUpdated === 1) {
          nbMatchesUpdated++;
          // Emit an event for update bets
          eventEmit.emit('save', newMatch);
          // Mettre à jour le vainqueur à sa nouvelle place
          logger(nbUpdated + ' match saved');
          updateTeams(newMatch, function(err, theMatch, firstTeam, secondTeam) {
            if (err) {
              logger(err, 'error');
              // Send an alert to developer
              if (--pending <= 0) {
                launchTimeout();
              }
              return;
            }
            updateRtms(newMatch, firstTeam, secondTeam, function(err) {
              if (err) {
                logger(err, 'error');
                // Send an alert to developer
              }
              if (--pending <= 0) {
                launchTimeout();
              }
              return;
            });
          });
        }
      }
    });
  } else {
    logger('no score for the match ' + match.teamHome.team.country + ' - ' + match.teamAway.team.country);
    if (--pending <= 0) {
      launchTimeout();
    }
  }
};

/**
 * Find the match finished for retrieve their score
 *
 * @param {Date} now - The date of criteria to find matches to update
 */
var fetchScores = function() {
  logger('fetchScores');
  var now = varDyn.date;
  // Add game time
  now.setMinutes(now.getMinutes()+90);
  // Find games whose date is now less and whose score is not yet defined
  Match.find({date: {$lt: now}, 'score.home': null})
    .populate('teamHome')
    .populate('teamAway')
    .sort('date')
    .exec(function(err, matches) {
    if (err) {
      // TODO: Ajouter un compteur d'erreur simultanées
      logger(err, 'error');
      simulErrors.db++;
      if (simulErrors.db > 5) {
        logger('Exit after 6 simultaneous errors on db', 'error');
        process.exit(1);
      }
      return;
    }
    simulErrors.db = 0; // counter reset
    if (matches.length > 0) {
      logger('nb matches: ' + matches.length);
      getNodes(function(err, nodes) {
        if (err || nodes === null) {
          if (nodes === null) {
            err = 'Nodes match-list not found';
          }
          logger(err, 'error');
          launchTimeout();
          return;
        }
        pending = matches.length;
        var opts = [
          { path: 'teamHome.team', select: 'country', model: 'Team'},
          { path: 'teamAway.team', select: 'country', model: 'Team'}
        ];
        Match.populate(matches, opts, function(err, matchesP) {
          var matchesDate = {}, dateFormatted;
          for (var i = matchesP.length - 1; i >= 0; i--) {
            if (matchesP[i].teamHome.team === null) {
              continue;
            }
            // Change to timezone of brazil
            matchesP[i].date.setHours(matchesP[i].date.getHours()-3);
            dateFormatted = matchesP[i].date.format('YYYYMMDD');
            if (!matchesDate.hasOwnProperty(dateFormatted)) {
              matchesDate[dateFormatted] = [];
            }
            matchesDate[dateFormatted].push(matchesP[i]);
          }
          Object.keys(matchesDate).forEach(function(date, index) {
            if (varDyn.dryrun) {
              setTimeout(findScore, index*1000, nodes, date, matchesDate[date], saveMatchScore);
            } else {
              findScore(nodes, date, matchesDate[date], saveMatchScore);
            }
          });
        });
      });
    } else {
      pending = 0;
      logger('No matches found');
      launchTimeout();
    }
  });
};

// =======================================================
//              LAUNCH DAEMON
// =======================================================
db.once('open', function() {
  logger('db connection opened');
  fetchScores();
});

/**
 * Close properly the daemon
 *
 * @param {String} msg - The final message to display
 */
var closeDaemon = function(msg) {
  killCalled = true;
  if (timer)
    clearTimeout(timer);
  if (db)
    db.close();
  if (req) {
    req.abort();
  }
  logger(msg);
};
db.on('error', function(err) {
  closeDaemon('connection error:' + err);
});
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
  console.log(nbMatchesUpdated + ' matches updated', 'success');
});