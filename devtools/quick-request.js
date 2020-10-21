const settings = require('./settings.js');

(async () => {
  const API = require("airdcpp-apisocket");
  const w3cwebsocket = require("websocket").w3cwebsocket;
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  const socket = API.Socket(settings, w3cwebsocket);
  await socket.connect();


  const results = await socket.get('share_roots');

  const virt = new Set();

  for (const result of results) {
    virt.add(result.virtual_name)
  }

  console.log(virt);


  socket.disconnect();
})();