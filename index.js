// https://api.moves-app.com/oauth/v1/authorize?client_id=Z11MshMgone0lK3z0pAv1k16XqIsvz96&redirect_uri=http%3A%2F%2Flocal.host%3A3000%2Fauth%2Fmoves%2Fcallback&scope=default
var util = require('util');
var url = require('url')

exports = module.exports = function (everyauth) {
  if (! everyauth.oauth2) {
    everyauth.oauth2 = require("everyauth-oauth2")(everyauth);
  }
  everyauth.moves =
  everyauth.oauth2.submodule('moves')
  .configurable({
    scope: 'Space-delimited string containing either "activity", "location" or both scopes.'
  })

  .apiHost('https://api.moves-app.com/api/1.1')
  .oauthHost('https://api.moves-app.com/oauth/v1')
  .oauthHost('https://api.moves-app.com/oauth/v1')
  .authPath('/authorize')
  .authQueryParam('response_type', 'code')

  .accessTokenPath('/access_token')
  .accessTokenParam('grant_type', 'authorization_code')

  // redirect_uri must match the one sent with the authPath
  .accessTokenParam('redirect_uri', function () {
    if (this._callbackPath) {
      return this._myHostname + this._callbackPath;
    }
  })

  .authQueryParam('scope', function () {
    return this._scope;
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/user/profile', accessToken, function (err, data) {
      console.log(arguments);
      if (err) return p.fail(err);
      console.log("DATA", data);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    });
    return p;
  })

  everyauth.moves.mobile = function (isMobile) {
    if (isMobile) {
      this.oauthHost('moves://app')
          .authPath('moves://app/authorize');
    }
    return this;
  };

  everyauth.moves.AuthCallbackError = AuthCallbackError;

  return everyauth.moves;
};

function AuthCallbackError(req) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'AuthCallbackError';
  var parsedUrl = url.parse(req.url, true);

  // Error can be:
  // - "access_denied" user denied access to your app
  // - "unauthorized_client" your app is either disabled or client_id was wrong
  // - "invalid_request" a param was missing or invalid. e.g., check that
  //   redirect_uri is valid if you provided one
  // - "invalid_scope"
  // - "server_error" an unexpected error and auth request couldn't be handled
  this.message = parsedUrl.query && parsedUrl.query.error;
  this.req = req;
}
util.inherits(AuthCallbackError, Error);
