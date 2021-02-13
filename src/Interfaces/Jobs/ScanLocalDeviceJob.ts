import iRepeatJobBase from "Interfaces/IRepeatJobBase.interface";
import bonjour from "bonjour"
import SocketStore from "Singleton/SocketStore.js";
class ScanLocalDeviceJob implements iRepeatJobBase {
    private intervalUpdate: number;
    private bonjourService: bonjour.Bonjour;
    private scanOption: any;
    private socketStore: SocketStore;

    constructor(intervalUpdate: number) {
        this.intervalUpdate = intervalUpdate;
        this.scanOption = {
        }
        this.bonjourService = bonjour()
    }
    public run = () => {
        setInterval(this.handler, this.intervalUpdate)
    }
    public linkStore(store: any) {
        this.socketStore = store;
    }
    public handler = () => {
        this.bonjourService.find(this.scanOption, (service: bonjour.RemoteService) => {
            if (!service.txt.data1) {
                return
            }
            let now = new Date()
            console.log("Timenow at start : ", now.getTime())
            let data1 = service.txt.data1;
            let iv = service.txt.iv
            let apiKey = ""
            let targetService = this.socketStore.getSocket("decrypt")
            if (targetService == null) {
                return
            }
            if (data1 != null && iv != null) {
                let payload = {
                    apiKey,
                    iv,
                    data1
                }

                targetService.emit("decrypt", payload)
                console.log("Timenow at sent : ", now.getTime())

            }

        })
    }

}
export default ScanLocalDeviceJob