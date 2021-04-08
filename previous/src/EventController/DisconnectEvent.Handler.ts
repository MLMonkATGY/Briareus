import IEventHandlerBase from "Interfaces/IEventHandlerBase.interface";
import SocketStore from "Singleton/SocketStore";
import { Socket } from "socket.io";

class DisconnectEventHandler implements IEventHandlerBase{
    private eventName: string = "disconnect";
    private store: any; 
    constructor() {
        
    }
    /**
     * handler
     */
    public handler(data:any, client:Socket, store : SocketStore, eventEmitter:any) {
        console.log("on disconnect", data)
        store.removeSocket(client.id)
        console.log("After removing size:",store.getAllSockets().has(data.broadcastFunction))
    }
    public getEventName = () => {
        return this.eventName;
    };
    public linkStore = (store : any) => { 
        this.store = store; 
    }
}
export default DisconnectEventHandler;