const express = require("express");
const router = express.Router();

router
  .get("/", (req, res) => {
    res.send(users);
  })
  .get("/:id", (req, res) => {
    const { id } = req.params;
    const user = users.find(user => user.id == id);

    if (user) {
      res.send(user);
    } else {
      res.status(404).send(`User ${id} does not exist`);
    }
  })
  .delete("/:id", (req, res) => {
    const { id } = req.params;
    const index = users.findIndex(user => user.id == id);

    if (index > -1) {
      users.splice(index, 1);
      res.sendStatus(200);
    } else {
      res.status(404).send(`User ${id} does not exist`);
    }
  })
;

module.exports = router;


var users = [{
  "id": 1,
  "first_name": "Gregory",
  "last_name": "Garcia",
  "email": "ggarcia0@list-manage.com",
  "gender": "Male",
  "ip_address": "23.180.99.244"
}, {
  "id": 2,
  "first_name": "Paul",
  "last_name": "Johnston",
  "email": "pjohnston1@theguardian.com",
  "gender": "Male",
  "ip_address": "188.240.13.65"
}, {
  "id": 3,
  "first_name": "Joshua",
  "last_name": "Evans",
  "email": "jevans2@wikispaces.com",
  "gender": "Male",
  "ip_address": "201.167.215.203"
}, {
  "id": 4,
  "first_name": "Daniel",
  "last_name": "Bradley",
  "email": "dbradley3@1688.com",
  "gender": "Male",
  "ip_address": "139.160.206.22"
}, {
  "id": 5,
  "first_name": "Joshua",
  "last_name": "Owens",
  "email": "jowens4@myspace.com",
  "gender": "Male",
  "ip_address": "87.121.145.177"
}, {
  "id": 6,
  "first_name": "Juan",
  "last_name": "Cook",
  "email": "jcook5@ted.com",
  "gender": "Male",
  "ip_address": "208.207.198.34"
}, {
  "id": 7,
  "first_name": "Roger",
  "last_name": "Richards",
  "email": "rrichards6@csmonitor.com",
  "gender": "Male",
  "ip_address": "197.31.189.30"
}, {
  "id": 8,
  "first_name": "Nicole",
  "last_name": "Frazier",
  "email": "nfrazier7@naver.com",
  "gender": "Female",
  "ip_address": "131.2.199.243"
}, {
  "id": 9,
  "first_name": "Jason",
  "last_name": "Richards",
  "email": "jrichards8@altervista.org",
  "gender": "Male",
  "ip_address": "197.26.9.129"
}, {
  "id": 10,
  "first_name": "Fred",
  "last_name": "Castillo",
  "email": "fcastillo9@printfriendly.com",
  "gender": "Male",
  "ip_address": "131.197.248.91"
}, {
  "id": 11,
  "first_name": "Ashley",
  "last_name": "Wheeler",
  "email": "awheelera@springer.com",
  "gender": "Female",
  "ip_address": "235.61.148.27"
}, {
  "id": 12,
  "first_name": "Larry",
  "last_name": "Watson",
  "email": "lwatsonb@indiegogo.com",
  "gender": "Male",
  "ip_address": "5.210.92.121"
}, {
  "id": 13,
  "first_name": "Antonio",
  "last_name": "Ramirez",
  "email": "aramirezc@sciencedirect.com",
  "gender": "Male",
  "ip_address": "99.101.113.235"
}, {
  "id": 14,
  "first_name": "Joan",
  "last_name": "Lane",
  "email": "jlaned@google.de",
  "gender": "Female",
  "ip_address": "184.181.98.33"
}, {
  "id": 15,
  "first_name": "Christopher",
  "last_name": "Williams",
  "email": "cwilliamse@wikipedia.org",
  "gender": "Male",
  "ip_address": "21.222.171.157"
}, {
  "id": 16,
  "first_name": "Anthony",
  "last_name": "Austin",
  "email": "aaustinf@wikipedia.org",
  "gender": "Male",
  "ip_address": "203.242.152.78"
}, {
  "id": 17,
  "first_name": "Phillip",
  "last_name": "Patterson",
  "email": "ppattersong@mayoclinic.com",
  "gender": "Male",
  "ip_address": "10.60.134.212"
}, {
  "id": 18,
  "first_name": "Juan",
  "last_name": "Lewis",
  "email": "jlewish@yandex.ru",
  "gender": "Male",
  "ip_address": "248.164.174.239"
}, {
  "id": 19,
  "first_name": "Amy",
  "last_name": "Ward",
  "email": "awardi@reference.com",
  "gender": "Female",
  "ip_address": "163.192.15.31"
}, {
  "id": 20,
  "first_name": "Joe",
  "last_name": "Watkins",
  "email": "jwatkinsj@stanford.edu",
  "gender": "Male",
  "ip_address": "81.61.50.153"
}]
