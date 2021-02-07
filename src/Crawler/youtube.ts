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
class youtube extends GenericCrawler {
 
  public dbOrmConnection : any;
  public saveToDbInterval : any;
  public orm : any;
  public repo:any;
  constructor() {
      super()
      this.saveToDbInterval = 3000

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
   
    const aasda = new Channels(Math.random().toString(), "asda");
    this.repo.persist(aasda);
     const resp = await page.goto(link).catch((e) => {
      if (e.message.includes("Navigation failed because page was closed!")) {
        return
      } else {
        console.log("page does not exist");
        console.log(link);
        console.log(e)
        resolve(link)
        // await page.close()
        return
      }


    })
    if(resp){
        try {
            
            console.log(resp)
            resolve(true);
            const aasda = new Channels(Math.random().toString(), "asda");
            this.repo.persist(aasda);
        }        
        catch (error) {
          console.log(error)
          resolve(true);

      }
    //   console.log("hee")

      // console.log(image)
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
   
    const finalPayloads = ["https://www.youtube.com/watch?v=onMD8tvnLbs", "https://www.youtube.com/watch?v=7aipxljwrZQ"]
   
    let allBrowser:BrowserContext[] = await this.generateBrowserContext(2, false )

    await this.downloadThumbnail(allBrowser, 2, finalPayloads)

    console.log("=================All DONE===========================")




  };

}

export default youtube;
