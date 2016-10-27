import http from "http";
import { homepage, notFound } from "./handlers";

const server = http.createServer((request, response) => {
  homepage(request, response);
});

server.listen(3000);
