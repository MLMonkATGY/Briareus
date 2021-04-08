import { spawn } from "child_process";
import SocketStore from "Singleton/SocketStore";
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import { firefox,chromium, Browser, Page, BrowserContext, Request, Route } from "playwright";
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
import Channels from "../Entity/Channels.js";

class GenericCrawler implements iCrawlerJob {
  private intervalUpdate: number;
  private socketStore: SocketStore;
  private rejectedNum : number;
  private succeedNum : number;
  private totalPayloadNum : number;
  public dbOrmConnection : any;
  public saveToDbInterval : any;
  public closePageEachRequest : boolean;
  public orm : any;
    public repo:any;
  constructor() {
    
  }

  public  setOrmConn = async ()=>{
    const orm = await MikroORM.init({
            entities: [Channels],
            dbName: 'alextay96',
            type: 'mongo'
          });
    // const em = orm.em.fork();
    this.orm = orm
    return orm
    // return em;
    }  
    public persistConfig = async ()=>{
         
    }
 
  public getUserPrefString = (port: number) => {
    return `
    user_pref("browser.aboutwelcome.enabled", false);
    user_pref("network.proxy.socks", "127.0.0.1");
    user_pref("network.proxy.type", 1);
    user_pref("network.proxy.socks_port", ${port});
    user_pref("network.proxy.socks_remote_dns", true);  
    user_pref("network.proxy.socks_version", 5);
	`;
  }
  public generateBrowserContext = async (browserInstance: number, headless:boolean): Promise<BrowserContext[]> => {
    let tmpDir = "/home/alextay96/Desktop/workspace/3d-eff/Briareus/resources/tmp";
    let allBrowserContextP = [];
    const lowestPort = 8000 + browserInstance
    // let allOccupiedPorts = new Set() 
    fs.rmdirSync(tmpDir, { recursive: true })
    let portNum = lowestPort + Math.round((Math.random() * 100) % browserInstance)
    const ports = _.range(portNum, 8000, -1)
    for (let i = 0; i < browserInstance; i++) {
      let portNum = ports[i]


      let userPrefString = this.getUserPrefString(portNum)
      let userDataDir = tmpDir + `/${i}`
      fs.mkdirSync(userDataDir, { recursive: true });

      fs.writeFileSync(path.join(userDataDir, "user.js"), userPrefString);
      const browser =  firefox.launchPersistentContext(
        userDataDir, {
        headless: headless,
      });
      // const browser =  firefox.launch(
      //    {
      //   headless: headless,
      // });
      allBrowserContextP.push(browser)
    }
    const allBrowserContext = await Promise.all(allBrowserContextP)
    allBrowserContext.forEach(elem=>{
      elem.setDefaultTimeout(60000)

    })


    return allBrowserContext
  }
  public generateBrowserContext2 = async (browserInstance: number, headless:boolean): Promise<BrowserContext[]> => {
    let allBrowserContextP = []
    for (let i = 0; i < browserInstance; i++) {

      

      const browser =  chromium.launch( {
        headless: headless,
      });
      allBrowserContextP.push(browser)
    }
    const allBrowserContext = await Promise.all(allBrowserContextP)
    // allBrowserContext.forEach(elem=>{
    //   elem.setDefaultTimeout(60000)

    // })


    return allBrowserContext
  }
  public atomicPageLevelExecutor = async (page: Page, link: string, resolve, reject, repo) => {
   

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
  public waitFor = async (timeout: number) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, timeout);
    })
  }
  public pageWorker = async (page: Page, link: string, repo) => {
    return new Promise((resolve, reject) => {
      this.atomicPageLevelExecutor(page, link, resolve, reject, repo)
    })
  }
   public interceptImages = async(page)=>{
    page.route('**/*', (route:Route) => {
     return route.request().resourceType() === 'image'
       ? route.abort()
       : route.continue()
   })
 }
  public pageScheduler = async (browser: BrowserContext, payload: string[], em:EntityManager) => {
    
    return new Promise(async (resolve, reject) => {
      
      // const em = await getEntityManager()
      
      const repo = this.repo;
      let allPromiseInCurrentRound = []
      let allPages: Page[] = []
      let pageOpened: number = 0;
      for (let i = 0; i < payload.length; i++) {
        const link = payload[i]
        const p = await browser.newPage()
        allPages.push(p)
        // this.interceptImages(p)
        // const cacheEM = await getEntityManager()
        allPromiseInCurrentRound.push(this.pageWorker(p, link,repo))
        pageOpened++
      }

      console.log(`This browser opened ${pageOpened} pages`)
      // await Promise.all(allPromiseInCurrentRound)
      
      if(this.closePageEachRequest){
        let closingPromises = []
        for (let j = 0; j < allPages.length; j++) {
          closingPromises.push(allPages[j].close())
        }
        await Promise.all(closingPromises).catch((err) => {
          console.log(err)
          resolve(true)
  
        })
      }else{
        console.log("No resolving browser. Reused page for each request")
      }
  
     
      // resolve(true)
    })


  }
  /**
   * pageScheduler
   */
  public makeRepeated = (arr, repeats) => {
    return Array.from({ length: repeats }, () => arr);

  }



  public setRepo = async(repo)=>{
    this.repo = repo
  }

  public downloadThumbnail = async (allBrowser: BrowserContext[], pagenum: number, payloads: string[]) => {
   
    await this.persistConfig()
    const totalPayloads = _.chunk(payloads, pagenum)

    let browserRole = this.makeRepeated(_.range(allBrowser.length), Math.round(totalPayloads.length / allBrowser.length))
    browserRole = _.flatten(browserRole)
    console.log(`packs of totalPayloads = ${totalPayloads.length}`)
    console.log(`req per payload = ${totalPayloads[0].length}`)
    const orm = await this.setOrmConn()
   
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

export default GenericCrawler;
