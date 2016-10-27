var _ = require("lodash");
var axios = require("axios");

axios.get("http://rest.learncode.academy/api/myuser/friends").then((res) => {
  var jake = _.find(res.data, {name: "Jake"});
  console.log(jake);
})
