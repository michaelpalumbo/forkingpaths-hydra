import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const wsclient = new WebSocket('ws://172.20.10.5:8080/ws');

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    if(wsclient){
      wsclient.send(data);
    }
  });

  // ws.send('something');
});


wsclient.on('error', console.error);

wsclient.on('open', function open() {
  // wsclient.send('something');
});

wsclient.on('message', function message(data) {
  console.log('received: %s', data);
});
