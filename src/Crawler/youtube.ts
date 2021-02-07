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
import _ from "underscore";
import DoujinInfo from "../Entity/DoujinInfo.js";
import Tags from "../Entity/Tags.js";
import iCrawlerJob from "Interfaces/iCrawlerJob.interface";
import GenericCrawler from "./GenericCrawler.js";
class youtube extends GenericCrawler {
 
  public dbOrmConnection : any;
  public saveToDbInterval : any;
  constructor() {
      super()
  

  }
 
 

  public atomicPageLevelExecutor = async (page: Page, link: string, resolve, reject) => {
   

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
        }        
        catch (error) {
          console.log(error)
          resolve(true);

      }

      // console.log(image)
    }

    


  }

  /**
   * pageScheduler
   */
 





  public downloadThumbnail = async (allBrowser: BrowserContext[], pagenum: number, payloads: string[]) => {
   

    const totalPayloads = _.chunk(payloads, pagenum)

    let browserRole = this.makeRepeated(_.range(allBrowser.length), Math.round(totalPayloads.length / allBrowser.length))
    browserRole = _.flatten(browserRole)
    console.log(`packs of totalPayloads = ${totalPayloads.length}`)
    console.log(`req per payload = ${totalPayloads[0].length}`)
    const orm = await MikroORM.init({
      entities: [Author, Tags,Doujinshi, DoujinInfo],
      dbName: 'alextay96',
      type: 'postgresql',
      clientUrl: 'postgresql://alextay96@127.0.0.1:5432',
      user: 'alextay96',
      password: "Iamalextay96"
    });
    setInterval(async()=>{
      await orm.em.flush().catch(err=>{
        console.log("Flush reject")
        console.log(err)

      })
      console.log("Flushed persisted entity")
    }, 10000)
    let i = 0;
    while (i < totalPayloads.length) {
      let allPromise = []

      for (let j = 0; j < allBrowser.length; j++) {
        //Deep copy the payload to avoid sometimes the payload is undefined due to async access
        try {
          const currentBrowser = allBrowser[browserRole[j]]

          const currentPayload = JSON.parse(JSON.stringify(totalPayloads[i]));

          let a = this.pageScheduler(currentBrowser, currentPayload, orm.em)
          allPromise.push(a)
          i++;
        } catch (error) {
          console.log(error)
          continue          

        }
        
      }
      console.log("waiting for this round of request to resolve")
      try {
        await Promise.all(allPromise).catch((err) => {
          console.log(err)
          
        })   
      } catch (error) {
        console.log("Exception")
      }
     
      // await repo.flush()
      allPromise = []

    }

  }

  public topLevelTaskScheduler = async () => {
   
    const finalPayloads = ["https://www.youtube.com/watch?v=onMD8tvnLbs", "https://www.youtube.com/watch?v=7aipxljwrZQ"]
    let allBrowser:BrowserContext[] = await this.generateBrowserContext(2, false )

    await this.downloadThumbnail(allBrowser, 2, finalPayloads)

    console.log("=================All DONE===========================")




  };

}

export default youtube;
