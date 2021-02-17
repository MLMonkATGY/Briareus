import App from "./App.js";

import * as bodyParser from "body-parser";
import HomeController from "./Controller/Home.Controller.js";
import GatewayStatusUpdate from "./EventController/GatewayStatusUpdate.Handler.js";
import DisconnectEventHandler from "./EventController/DisconnectEvent.Handler.js";
import ReceiveDecryptedEvent from "./EventController/ReceiveDecyptedEvent.Handler.js";


import GenericCrawler from "./Crawler/GenericCrawler.js";
import ExploreChannels from "./Crawler/ExploreChannels.js";
import SshScheduler from "./Jobs/SshScheduler.js";
import DownloadAndSplit from "./Jobs/DownloadVideoAndSplitJob.js";
import UploadEventDataJob from "./Jobs/UploadEventDataJob.js";
import TriggerFunctionCompute from "./Jobs/TriggerFunctionCompute.js";
import ZipToTransfer from "./Jobs/ZipToTransfer.js";

  
const app: App = new App({
    port: 7901,
    controller: [
      // new HomeController()
    
    ],
    middleware: [
      // bodyParser.json(),
      // bodyParser.urlencoded({ extended: true })
    ],
    websocketHandler: [
      // new GatewayStatusUpdate(),
      // new DisconnectEventHandler()
      // , new ReceiveDecryptedEvent()
    ],
    jobHandler: [
      // new GetThumbnailByAuthor(),
      // new DownloadLinksByArtist()
      // new PreviewThumbnail()
      // new DownloadThumbnail(),
      // new FilterResources()
      // new DownloadAndSplit()
      // new UploadEventDataJob()
      // new TriggerFunctionCompute()
      new ZipToTransfer()
    ],
    crawlerHandler : [
      // new ExploreChannels()
    ]
  });

app.listen();
  



