import IEventHandlerBase from "Interfaces/IEventHandlerBase.interface";

class GenericEventHandler  {
    private eventName: string = "generic_event";
    private eventMaps: Map<string, Function>;

    constructor() {
        
    }
    public registerHooks = (eventName : string, handler:Function) => {
        this.eventMaps.set(eventName, handler)
    }
    /**
     * handler
     */
    public handler(data:any) {
        if (data.event) { 
            let customEvent = data.event;
            this.eventMaps[customEvent].handler(data)
        }

    }
    public getEventName = () => {
        return this.eventName;
      };
}
export default GenericEventHandler;