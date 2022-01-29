import {
  GatewayDispatchPayload,
  GatewayOpcodes,
  GatewayPresenceUpdateData,
  GatewayReceivePayload,
  GatewaySendPayload,
} from 'discord-api-types/v9';
import EventEmitter from 'events';
import { platform } from 'os';
import Socket from 'ws';
import { Intents } from './Intents';

type GatewayMessage =
  | GatewaySendPayload
  | GatewayReceivePayload
  | GatewayDispatchPayload;

export interface CorvineWebSocketOpts {
  gatewayURL: string;
  intents: (keyof typeof Intents)[];
  presence?: GatewayPresenceUpdateData;
}

export class CorvineWebSocket extends EventEmitter {
  private socket!: Socket;
  private _intents: number | bigint;
  private _presence?: GatewayPresenceUpdateData;
  private _heartbeatInterval: number | null = null;
  public _connected = false;
  constructor(private token: string, private opts: CorvineWebSocketOpts) {
    super();
    this.opts.presence =
      this.opts.presence ?? ({} as GatewayPresenceUpdateData);
    this._presence = this.opts.presence;
    this._intents = this.opts.intents.reduce(
      (prev, curr) => prev | Intents[curr],
      0
    );
  }

  public async connect() {
    this.socket = new Socket(this.opts.gatewayURL);
    this.socket.on('open', () => {
      // Do Nothing
    });
    this.socket.on('message', async data => {
      const message: GatewayMessage = JSON.parse(data.toString());
      this.emit('RawGatewayMessage', message);
      switch (message.op) {
        case GatewayOpcodes.Hello:
          this._heartbeatInterval = message.d.heartbeat_interval;
          this.sendHeartbeat().then(() => {
            setInterval(this.sendHeartbeat, this._heartbeatInterval ?? 0);
          });
          this.socket.send(
            JSON.stringify({
              op: GatewayOpcodes.Identify,
              d: {
                token: this.token,
                properties: {
                  $os: platform(),
                  $browser: 'Corvine',
                  $device: 'Corvine',
                },
                intents: this._intents,
                presence: this._presence,
              },
            }),
            err => {
              if (err) throw err;
              this._connected = true;
            }
          );
          break;

        case GatewayOpcodes.Heartbeat:
          this.sendHeartbeat();
          break;

        case GatewayOpcodes.Dispatch:
          this.emit('GatewayDispatch', message.t, message);
          break;

        default:
          break;
      }
    });
  }

  private async sendHeartbeat() {
    this.socket.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: null,
      })
    );
  }
}
