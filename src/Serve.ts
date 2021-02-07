import App from "./App.js";

import * as bodyParser from "body-parser";
import HomeController from "./Controller/Home.Controller.js";
import GatewayStatusUpdate from "./EventController/GatewayStatusUpdate.Handler.js";
import DisconnectEventHandler from "./EventController/DisconnectEvent.Handler.js";
import ScanLocalDeviceJob from "./Jobs/ScanLocalDeviceJob.js";
import ReceiveDecryptedEvent from "./EventController/ReceiveDecyptedEvent.Handler.js";

import GetThumbnailByAuthor from "./Jobs/GetThmbnailByAuthor.js";
import DownloadLinksByArtist from "./Jobs/DownloadLinksByArtist.js";
import PreviewThumbnail from "./Jobs/PreviewThumbnail.js";
import DownloadThumbnail from "./Jobs/DownloadThumbnail.js";
import FilterResources from "./Jobs/FilterEmptyFolder.js";
import GenericCrawler from "./Crawler/GenericCrawler.js";
import ExploreChannels from "./Crawler/ExploreChannels.js";

  
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
    ],
    crawlerHandler : [
      new ExploreChannels()
    ]
  });

app.listen();
  



