import SocketStore from "Singleton/SocketStore";
import { Socket } from "socket.io";

interface IEventHandlerBase {
  handler(data: any, client: Socket,
    socketStoreRef: SocketStore,
    eventEmitter: any): any;
  getEventName(): string;
  linkStore(store: any): void;
}
export default IEventHandlerBase;
