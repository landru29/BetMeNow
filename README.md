# World Cup Brazil 2014

The site is accessible on (http://wcb2014.herokuapp.com/).

## Dependencies

* Node.js
* MongoDB
* bower

## Install
### Modules
```
$ git clone https://github/Azema/WCB.git
$ cd WCB
$ npm install
```

### Data
```
$ mongoimport --drop -d wcb-dev -c teams < ./data/teams.json
$ mongoimport --drop -d wcb-dev -c matches < ./data/matches.json
$ mongoimport --drop -d wcb-dev -c teams_matches < ./data/teams_matches.json
```

## Launch
```
$ grunt
```


## Teams

## Groups

## Users

## Bets
