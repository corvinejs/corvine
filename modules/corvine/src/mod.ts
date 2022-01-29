import EventEmitter from 'events';
import { CorvineWebSocket, CorvineWebSocketOpts } from '@corvinejs/ws';
import { CorvineRest } from '@corvinejs/rest';

export interface CorvineClientOpts {
  wsOpts: Omit<CorvineWebSocketOpts, 'gatewayURL'>;
}

export class CorvineClient extends EventEmitter {
  private ws!: CorvineWebSocket;
  public rest: typeof CorvineRest;
  protected _gatewayData!: Record<string, unknown>;
  constructor(public token: string, protected opts: CorvineClientOpts) {
    super();
    this.rest = CorvineRest.bind({ token });
  }

  public async connect() {
    this._gatewayData = await (await this.rest('GET', '/gateway/bot')).json();
    this.ws = new CorvineWebSocket(this.token, {
      gatewayURL: `${
        this._gatewayData?.url ?? 'wss://gateway.discord.gg'
      }?v=9&encoding=json`,
      ...this.opts.wsOpts,
    });
    this.ws.on('RawGatewayMessage', console.log);
    return this.ws.connect();
  }
}
