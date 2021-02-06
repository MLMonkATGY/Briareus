import IEventHandlerBase from "Interfaces/IEventHandlerBase.interface";
import SocketStore from "Singleton/SocketStore";
import { Socket } from "socket.io";

class ReceiveDecryptedEvent implements IEventHandlerBase {
    private eventName: string = "decryption_done";
    private store: any;
    private contextReso: Response;
    constructor() {

    }
    /**
     * handler
     */
    public handler(data: any, client: Socket, store: SocketStore, eventEmitter: any) {
        if (data[0].error) {
            console.log("Error : on receive decrypted", data.error)
            eventEmitter.emit("decryption_transfer", data)

        } else {
            let now = new Date()
            console.log("Timenow at received : ", now.getTime())
            console.log("on receive decrypted", data)
            eventEmitter.emit("decryption_transfer", data)
        }
    }
    // public registerContextResponse = (resp : Response) => { 
    //     this.res
    // }
    public getEventName = () => {
        return this.eventName;
    };
    public linkStore = (store: any) => {
        this.store = store;
    }
}
export default ReceiveDecryptedEvent;