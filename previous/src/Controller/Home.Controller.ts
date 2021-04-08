import { DiscoveryBroadcastDTO } from "DTO/DiscoveryBroadcastDTO";
import * as express from "express";
import { Request, Response } from "express";
import bonjour from "bonjour"
import {createConnection, createConnections} from "typeorm";

import IControllerBase from "../Interfaces/ICotrollerBase.interface";
import SocketStore from "Singleton/SocketStore";
import { Socket } from "socket.io";
import * as os from "os";
// import * as EventEmitter from 'events';
// const EventEmitter = require('events');
import  EventEmitter from 'events';

class HomeController implements IControllerBase {
  public path: string = "/";
  private bonjourService: bonjour.Bonjour;
  private eventEmitter: any;

  private socketStore: SocketStore;

  public router = express.Router();
  constructor() {
    this.initRoutes();
    this.bonjourService = bonjour()

  }

  public linkStore(store: any) {
    this.socketStore = store;
  }

  public initRoutes() {
    this.router.get("/", this.discoveryService);
    this.router.post("/", this.service);
    this.router.post("/streamingDataSink", this.streamingDataSink);
    this.router.post("/pollStatus", this.getCurrentDeviceStatus);
    // this.router.get("/batteryLevel", this.getBatteryLevel);

  }
  public linkEventEmitter = (eventEmitter: any) => {
    this.eventEmitter = eventEmitter;
  }
  public service = (req: Request, res: Response) => {
    const users = ["aasdsas", "111111"];
    res.send(users);
  };
  public streamingDataSink = (req: Request, res: Response) => {
    // let data = JSON.(req)
    console.log(req.method, req.url, req.headers);
    let jsonBody = req.body

    // await JSON.parse(req)
  }
  public discoveryService = async(req: Request, res: Response) => {
    // const discoveryDTO: DiscoveryBroadcastDTO = req.body;
    // if (discoveryDTO.deviceId !== "70:85:c2:7d:af:77") {
    //   res.status(403).send()
    // }
    const conn = await createConnection();
    // await conn.synchronize();
    let networkInterfaces = os.networkInterfaces();
    let mac: string = "";
    let ip: string = "";
    if (networkInterfaces.wifi0) {
      mac = networkInterfaces.wifi0[0].mac;
      ip = networkInterfaces.wifi0[0].address;

    } else if (networkInterfaces.eth0) {
      mac = networkInterfaces.eth0[0].mac;
      ip = networkInterfaces.eth0[0].address;

    }

    let responseData: DiscoveryBroadcastDTO = {
      deviceId: mac,
      localAddress: ip,
      broadcastService: "gateway"
    }
    res.send(responseData)
  }
  // public getBatteryLevel = async (req: Request, res: Response) => { 
  //   const lineReader = require('readline').createInterface({
  //     input: require('fs').createReadStream('/sys/class/power_supply/battery/capacity')
  //   });


  //   lineReader.on('line', (line: string) => {
  //     let batteryLevel: number = Number(line);
  //     res.send({
  //       batteryLevel
  //     })
     
  //   });
   
  // }
  public getCurrentDeviceStatus = (req: Request, res: Response) => {
    console.log(req.method, req.url, req.headers);
    let jsonBody = req.body
    let expectedDeviceNum = jsonBody.devices.length
    let payloadList = []
    let ipListInOrder = []
    let payloadIpMap = {}
    let targetService: Socket = this.socketStore.getSocket("decrypt");
    if (targetService == null) {
      res.status(401).send();
      this.eventEmitter.removeAllListeners()
      return;
    }
    let timer = setTimeout(() => {
      if (payloadList.length == 0) {
        res.status(401).send();
        this.eventEmitter.removeAllListeners()
      } else {
        console.log("Going thorugh timer")
        targetService.emit("decrypt", payloadList)
      }

    }, 400)
    this.eventEmitter.once("decryption_transfer", (decryptedPayload) => {
      let responseJSON = {
        devices: []
      }
      // if (decryptedPayload)
      //   decryptedPayload = [JSON.parse(decryptedPayload)]
      decryptedPayload.forEach((element) => {
        let modifiedState = element
        modifiedState.state = modifiedState.switch === "on"
        modifiedState.switch = null
        
        responseJSON.devices.push(modifiedState)

      });

      res.send(responseJSON)


    })
    this.bonjourService.find({}, (service: bonjour.RemoteService) => {
      // console.log(service)
      if (service.type != "ewelink") {
        return
      }
      let data1 = service.txt.data1;
      let iv = service.txt.iv
      let targetDevice = jsonBody.devices.filter(info => {
        return info.deviceId == service.txt.id
      })
      let apiKey: string = "";
      if (targetDevice[0] != null) {
        apiKey = targetDevice[0].apiKey

      } else { 
        return;
      }


      if (data1 != null && iv != null) {
        let payload = {
          apiKey,
          iv,
          data1,
          localAddress: service.referer.address,
          deviceId : service.txt.id
        }

        payloadList.push(payload)
        ipListInOrder.push(service.referer.address)
        if (payloadList.length == expectedDeviceNum) {
          clearTimeout(timer)
          console.log("Going direct")
          targetService.emit("decrypt", payloadList)
        }

      }


    })

  }

}
export default HomeController;
