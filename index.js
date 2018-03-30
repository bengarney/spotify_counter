/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs = require('fs');
const prettyMs = require('pretty-ms');

var client_id = '8127cb3c61574f31bfab353c77e3c97e'; // Your client id
var client_secret = '332076795bd04ead8e5b0a5816d3cc27'; // Your secret
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

let access_token = null;
let refresh_token = null;

var lastProgressMs = null, lastAlbum = null, lastTrack = null;
var checkIntervalMs = 10000;
var creditedTimeMs = 0;

var stateKey = 'spotify_auth_state';

function writeState() {
  let stateObj = {
    access: access_token,
    refresh: refresh_token,
    timeWorked: creditedTimeMs
  };

  fs.writeFileSync("state", JSON.stringify(stateObj));
}

function loadState() {
  try {
    let data = fs.readFileSync("state");
    var stateObj = JSON.parse(data);
  }
  catch (e) {
    console.log("Failed to read state: " + e);
    return;
  }

  access_token = stateObj.access;
  refresh_token = stateObj.refresh;
  creditedTimeMs = stateObj.timeWorked;
}

loadState();

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cookieParser());

app.get('/login', function (req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;

        console.log("access = " + access_token);
        console.log("refresh =  " + refresh_token);

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

function padTime(str, width) {
  while (str.length < width) str += " ";
  return str;
}

setInterval(() => {

  if (!access_token) {
    console.log("Waiting on auth to get currently playing");
    console.log("Please open http://localhost:8888/login");
    return;
  }

  var options = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function (error, response, body) {

    let newProgressMs = body.progress_ms;
    let newAlbum = body.item.album.name;
    let newTrack = body.item.name;

    if (newProgressMs !== lastProgressMs
      || newAlbum !== lastAlbum
      || newTrack !== lastTrack) {

      creditedTimeMs += checkIntervalMs;

      lastProgressMs = newProgressMs;
      lastAlbum = newAlbum;
      lastTrack = newTrack;

      writeState();
    }

    console.log(padTime(prettyMs(creditedTimeMs, { verbose: true }) + " worked", 40) + " " + padTime("progress=" + body.progress_ms, 20) + " album = " + body.item.album.name + " track = " + body.item.name);
  });

}, checkIntervalMs);

console.log('Listening on 8888');
app.listen(8888);
