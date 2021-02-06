import { Application } from "express";
import SocketStore from "./Singleton/SocketStore.js";
import ioserver, { Socket } from "socket.io";
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import IEventHandlerBase from "./Interfaces/IEventHandlerBase.interface";
import iRepeatJobBase from "./Interfaces/IRepeatJobBase.interface";
import iControllerBase from "Interfaces/ICotrollerBase.interface";
import EventEmitter from 'events';
import express from "express";
import * as http from "http";
import { createConnection } from "typeorm";
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import Doujinshi from "./Entity/Doujinshi.js";
import Author from "./Entity/Author.js";
import {default as setup} from "./Seed/CreateSchema.js";
import SeedWhiteList from "./Seed/SeedAuthor.js"
import setupSchema from "./Seed/CreateSchema.js";
class App {
  public app: Application;
  public port: number;
  public websocket: any;
  public server: any;
  public io: any;
  public eventHandlers: Array<any>;
  public jobHandler: Array<any>;
  public allConnectedSockets: Set<any>;
  public socketStore: SocketStore;
  public socketEventMaps: Map<string, Function>;
  public GlobalEventEmitter: any;
  public dbconnection : any
  constructor(appInit: {
    port: number;
    middleware: any;
    controller: any;
    websocketHandler: Array<IEventHandlerBase>;
    jobHandler: any;
  }) {
    this.app = express();
    this.port = appInit.port;

    //middleware needs to be init before router
    this.socketStore = new SocketStore();
    this.GlobalEventEmitter = new EventEmitter.EventEmitter();

    this.middlewares(appInit.middleware)
    this.routes(appInit.controller);

    this.server = new http.Server(this.app);
    this.jobHandler = appInit.jobHandler;

    this.registerIntervalJobs(this.jobHandler);

    if (appInit.websocketHandler) {
      this.io = ioserver(this.server);
      this.socketEventMaps = new Map<string, Function>();
      appInit.websocketHandler.forEach(handler => {
        this.registerHooks(handler.getEventName(), handler.handler)
        this.linkStore(handler)
      });
      this.eventHandlers = appInit.websocketHandler;
      this.io.on("connection", this.onConnectionHandler);

    }

  }
  private onConnectionHandler = (clientSocket: Socket) => {
    // this.socketEventRegister(this.eventHandlers, clientSocket);


    let id = clientSocket.id
    clientSocket.emit("alive", "this is from server");
    clientSocket.on("generic_event", (data: any) => {
      if (data.event) {
        let customEvent = data.event;
        this.socketEventMaps.get(customEvent)(data.payload, clientSocket, this.socketStore, this.GlobalEventEmitter)
      }
    })
    clientSocket.on("disconnect", (data: any) => {
      this.socketEventMaps.get("disconnect")(data, clientSocket, this.socketStore)
    })
  };

  private registerIntervalJobs = async (jobs: {
    forEach: (arg0: (job: any) => void) => void;
  }) => {
   const conn = await MikroORM.init( {

    entities: [Doujinshi, Author],
    dbName: 'alextay96',
    type: 'postgresql',
    clientUrl: 'postgresql://alextay96@127.0.0.1:5432',
    user: 'alextay96',
    password: "Iamalextay96" // defaults to 'mongodb://localhost:27017' for mongodb driver
});
  // const repo = conn.em.getRepository(Author);
  // let a = await repo.count()
    jobs.forEach((job: iRepeatJobBase) => {
      // job.linkStore(this.dbconnection)
      job.run(true);
    });
  };
  private middlewares = (middleWares: {
    forEach: (arg0: (middleWare: any) => void) => void;
  }) => {
    middleWares.forEach((middleWare) => {
      this.app.use(middleWare);
    });
  };

  private routes = (controllers: {
    forEach: (
      arg: (controller: iControllerBase, index: number, entireArray: any) => number
    ) => void;
  }) => {
    controllers.forEach((controller, index, entireArray) => {
      this.app.use("/", controller.router);
      controller.linkStore(this.socketStore)
      controller.linkEventEmitter(this.GlobalEventEmitter);
      return 1;
    });
  };

  public registerHooks = (eventName: string, handler: Function) => {
    this.socketEventMaps.set(eventName, handler)

  }
  public linkStore = (handlerClass: IEventHandlerBase) => {
    handlerClass.linkStore(this.socketStore)
  }

  public listen() {
    this.server.listen(this.port,() => {
      //  setupSchema().then(()=>{
      //   // SeedWhiteList();

      //  });
      console.log(`App listening on the http://0.0.0.0:${this.port}`);
    });
  }
}
export default App;
