const http = require("http");
const routes = require('./routes');
// routes can't be manipulated here

const server = http.createServer(routes);

server.listen(3000);
