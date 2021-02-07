import { spawn } from "child_process";
import SocketStore from "Singleton/SocketStore";
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import { firefox, Browser, Page, BrowserContext, Request, Route } from "playwright";
import path from "path";
import { EntityManager, EntityRepository, MikroORM } from "@mikro-orm/core";
import getEntityManager from "../Db/GetDbSettings.js";
import fs from "fs";
import Doujinshi from "../Entity/Doujinshi.js";
import Author from "../Entity/Author.js";
import _, { random } from "underscore";
import DoujinInfo from "../Entity/DoujinInfo.js";
import Tags from "../Entity/Tags.js";
import iCrawlerJob from "Interfaces/iCrawlerJob.interface";
import GenericCrawler from "./GenericCrawler.js";
import Channels from "../Entity/Channels.js";
import Queue from "../Infrastructure/Queue.js"
class ExploreChannels extends GenericCrawler {
 
  public dbOrmConnection : any;
  public saveToDbInterval : any;
  public orm : any;
  public repo:any;
  public traverseQueue : Queue;
  public channelQueue : Queue;
  public closePageEachRequest:boolean;
  constructor() {
      super()
      this.saveToDbInterval = 1000
      this.traverseQueue = new Queue()
      this.channelQueue = new Queue()
      this.closePageEachRequest = false
  }
  

 
  public  setOrmConn = async ()=>{
    const orm = await MikroORM.init({
        entities: [Channels],
        dbName: 'alextay96',
        type: 'postgresql',
        clientUrl: 'postgresql://alextay96@127.0.0.1:5432',
        user: 'alextay96',
        password: "Iamalextay96"
      });
    // const em = orm.em.fork();
    this.orm = orm
    return orm
    // return em;
}

  public atomicPageLevelExecutor = async (page: Page, link: string, resolve, reject) => {
   
    // const aasda = new Channels(Math.random().toString(), "asda");
    // this.repo.persist(aasda);
    let seenPage = 0;
    while(true){
      await this.waitFor(Math.round(Math.random()*3000))

      const t = await this.traverseQueue.pop()
    
      const fullPath = `https://www.youtube.com${t}`
  
      const resp = await page.goto(fullPath, {waitUntil:"domcontentloaded"}).catch((e) => {
        if (e.message.includes("Navigation failed because page was closed!")) {
            // console.log("here")
        } else {
          // console.log("page does not exist");
          // console.log(fullPath);
          // console.log(e)
          // resolve(link)
          // await page.close()
          
        }
  
  
      })
      seenPage++;

      if(true){
          try {
            await this.waitFor(3000)
            const rawPayloads = await page.$$eval('a', imgs => imgs.map(img => img.getAttribute("href")))
            const ChannelName = await page.$$eval('#top-row > ytd-video-owner-renderer > #upload-info > #channel-name > #container > #text-container > #text', imgs => imgs.map(img => img.textContent))
            const channelLinks = await page.$$eval('#top-row > ytd-video-owner-renderer > #upload-info > #channel-name > #container > #text-container > #text > a', imgs => imgs.map(img => img.getAttribute("href")))
            if(ChannelName[0] != null && channelLinks[0] != null){
              const entry = new Channels(ChannelName[0], channelLinks[0])
              await this.repo.persist(entry)
            }
            
            rawPayloads.forEach((links)=>{
              if(links){
                if(links.startsWith("/watch")){
                  // console.log(links)
                  this.traverseQueue.push(links)
                  // await this.waitFor(5000)
  
                }else if(links.startsWith("/channel")){
                  // console.log(links)
                  this.channelQueue.push(links)
                  
                }
              }
            })  
            
            // console.log(resp)
        
          }        
          catch (error) {
            // console.log(error)
            continue
            // resolve(true);
  
        }
      //   console.log("hee")
  
        // console.log(image)
      }
  
      
    }
   


  }

  /**
   * pageScheduler
   */
 





  

   public persistConfig = async ()=>{
    const orm = await this.setOrmConn()
    this.repo = (await orm).em.getRepository<Channels>(Channels);
    setInterval(async()=>{
        await orm.em.flush().catch(err=>{
          console.log("Flush reject")
          console.log(err)
  
        })
        console.log("Flushed persisted entity")
      }, this.saveToDbInterval )   
}
  public topLevelTaskScheduler = async () => {
    this.traverseQueue.push("/watch?v=lpbpvHBEHhY&t=51s")
    this.traverseQueue.push("/watch?v=nOtb3MAi3-U&t=180s")
    this.traverseQueue.push("/watch?v=ogoeQ2Y0E_Q&t=2s")
    this.traverseQueue.push("/watch?v=rlLcTlIOUg8&t=39s")


    const numOfWorker = 15
    const finalPayloads = ["https://www.youtube.com/watch?v=e_a9CZadOI8"]
    for(let i = 0 ; i < numOfWorker ; i++){
      finalPayloads.push("/watch?v=bMXBr06KClw")
    }
    let allBrowser:BrowserContext[] = await this.generateBrowserContext(10, false )
    setInterval(()=>{
      console.log(`Progress : checked ${this.traverseQueue.allDone.length} 
      Extra :${this.traverseQueue.list.length}  WaitList :${this.traverseQueue.waiting.length}` )
      console.log(`Progress : channels  :${this.traverseQueue.list.length}` )
    }, 5000)
    await this.downloadThumbnail(allBrowser, 1, finalPayloads)

    console.log("=================All DONE===========================")




  };

}

export default ExploreChannels;
