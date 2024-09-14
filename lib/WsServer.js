import CustomEvent from './CustomEvent.js';
import http from 'node:http';
import Server from './Server.js';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import { WebSocketServer } from 'ws';
import WsClient from './WsClient.js';


export default class WsServer extends Server {
  constructor(opts, ...args) {
    super(opts, ...args);

    if (opts.http) {
      this.type = "WS/HTTP";
      this.server = http.createServer((req, res) => {
          const serve = serveStatic('.', { index: ['index.html', 'index.htm'] })
          serve(req, res, finalhandler(req, res))
        });
    } else {
      this.type = "WS";
      this.server = http.createServer();
    }

    this.wss = new WebSocketServer({
      server: this.server
    });

    this.wss.on('connection', (stream, req) => {
      const client = new WsClient({
        downstreamAddress: req.socket.remoteAddress,
        downstreamPort: req.socket.remotePort,
        downstreamSocket: stream,
        server: this,
        upstreamAddress: opts.target,
        upstreamPort: opts.targetPort
      });

      this.dispatchEvent(new CustomEvent('connection', {
        detail: client
      }));

      // TODO: Track client?
    });

    this.server.listen(opts.port, opts.address, () => {
      this.dispatchEvent(new Event('listening'));
    });
  }
}