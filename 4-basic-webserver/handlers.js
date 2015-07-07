module.exports.homepage = function(request, response) {
  response.setHeader("Content-Type", "text/html");
  response.end("<h1>Hello World</h1>");
};

module.exports.profile = function(request, response) {
  var profile = {
    name: "Will",
    age: 34
  };
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(profile));
};

module.exports.notFound = function(request, response) {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/html");
  response.end("<h1>404 Not Found</h1>");
};
