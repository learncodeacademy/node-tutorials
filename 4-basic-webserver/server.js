var http = require('http');
var handlers = require('./handlers');

var server = http.createServer(function(request, response) {
  var headers = request.headers;
  var method  = request.method;
  var url = request.url;

  console.log(method, url);

  if (url === "/") {
    handlers.homepage(request, response);
  } else if (url === "/profile") {
    handlers.profile(request, response);
  } else {
    handlers.notFound(request, response);
  }
});

server.listen(3000);
