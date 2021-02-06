import { Socket } from 'socket.io';
class SocketStore {
    private connectedSockets: Map<string, Socket>;
    constructor() {
        this.connectedSockets = new Map<string, Socket>();
    }
    public addSocket = (client: Socket, functionalName : string) => {
        this.connectedSockets.set(functionalName, client);
    }
    public removeSocket = (functionalName : string) => {
        this.connectedSockets.delete(functionalName);
    }
    public getAllSockets = () => {
        return this.connectedSockets
    }
    public getSocket = (id: string): Socket => {
        let service : Socket = this.connectedSockets.get(id);
        return service;
     }
}
export default SocketStore;