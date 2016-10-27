var http = require("http");
var handlers = require("./handlers");

var server = http.createServer(function(request, response) {
  var url = request.url;

  if (url === "/") {
    handlers.homepage(request, response);
  } else if (url === "/profile") {
    handlers.profile(request, response);
  } else {
    handlers.notFound(request, response);
  }
});

server.listen(3000);
