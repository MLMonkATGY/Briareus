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
import {default as blacklist} from "../../resources/interim/blackList.js"
import DoujinInfo from "../Entity/DoujinInfo.js";
import Tags from "../Entity/Tags.js";
import https from "https"
import isCorrupted from "is-corrupted-jpeg";


class FilterResources implements iRepeatJobBase {
  private intervalUpdate: number;
  private socketStore: SocketStore;
  private rejectedNum : number;
  private succeedNum : number;
  private totalPayloadNum : number;

  constructor() {
    this.rejectedNum = 0;
    this.succeedNum = 0;
    this.totalPayloadNum = 0;

  }
  public linkStore = (store: SocketStore) => {
    this.socketStore = store;

  }
  public run = (runAtStartup: boolean) => {
    this.handler();


  };
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
    let tmpDir = "/home/alextay96/Desktop/workspace/dashboard_spy_nodejs_node/resources/tmp";
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
  
//   public interceptImages = async(page)=>{
//     page.route('**/*', (route:Route) => {
//      return route.request().resourceType() === 'image'
//        ? route.abort()
//        : route.continue()
//    })
//  }
  public getAuthorWorkNum = async (page: Page, link: string, resolve, reject, repo: EntityRepository<DoujinInfo>, cacheEm: EntityManager) => {
    let tmp = link.split("/")
    const basePath = "/home/alextay96/Desktop/workspace/dashboard_spy_nodejs_node/resources/doujinshi"
    const dirname = tmp[tmp.length - 2]
    const pagenum = tmp[tmp.length - 1]
    if (!fs.existsSync(`${basePath}/${dirname}`)){
      fs.mkdirSync(`${basePath}/${dirname}`);
  }
    await this.waitFor(Math.round(Math.random() * 200))

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
        const image = await resp.body()
        fs.writeFile(`${basePath}/${dirname}/${pagenum}`, image, (err)=> {
          if (err) {
            console.log(err)
  
          }
          resolve(true);
      })        
      } catch (error) {
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
  public pageWorker = async (page: Page, link: string, repo: EntityRepository<DoujinInfo>, cacheEm) => {
    return new Promise((resolve, reject) => {
      this.getAuthorWorkNum(page, link, resolve, reject, repo, cacheEm)
    })
  }
  // public interceptImages = async (page) => {
  //   page.route('**/*', (route: Route) => {
  //     // let a = route.request().url()
  //     return route.request().resourceType() === 'image' || !route.request().url().includes("nhentai")
  //       ? route.abort()
  //       : route.continue()
     
      
  //   })
  // }

  /**
   * pageScheduler
browser:BrowserContext, payload:string[]   */
  public pageScheduler = async (browser: BrowserContext, payload: string[], em:EntityManager) => {
    
    return new Promise(async (resolve, reject) => {
      
      // const em = await getEntityManager()
      
      const repo = em.getRepository<DoujinInfo>(DoujinInfo);
      let allPromiseInCurrentRound = []
      let allPages: Page[] = []
      let pageOpened: number = 0;
      for (let i = 0; i < payload.length; i++) {
        const link = payload[i]
        const p = await browser.newPage()
        allPages.push(p)
        // this.interceptImages(p)
        // const cacheEM = await getEntityManager()
        allPromiseInCurrentRound.push(this.pageWorker(p, link, repo, em))
        pageOpened++
      }
      console.log(`This browser opened ${pageOpened} pages`)
      let kk = await Promise.all(allPromiseInCurrentRound)
      let closingPromises = []
      for (let j = 0; j < allPages.length; j++) {
        closingPromises.push(allPages[j].close())
      }
      await Promise.all(closingPromises).catch((err) => {
        console.log(err)
        resolve(true)

      })
     
      resolve(true)
    })


  }
  /**
   * pageScheduler
   */
  public makeRepeated = (arr, repeats) => {
    return Array.from({ length: repeats }, () => arr);

  }





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

  private handler = async () => {
      const basePath = "/home/alextay96/Desktop/workspace/dashboard_spy_nodejs_node/resources/doujinshi"
    let a = fs.readdirSync(basePath)
    let dirToRemove = []
    let corruptedImages = []
    
    a.forEach(element => {
        let targetDir = `${basePath}/${element}`
        let allImages  = fs.readdirSync(targetDir)
        let target = allImages.length
        let allPageNum = allImages.map(elem=>{
            let temp = elem.replace(".jpg", "")
            return Number(temp)})
        let sortedImage = allPageNum.sort((a, b)=>{
            return a-b
        })
        let top10Percent = Math.round(sortedImage.length*0.1)
        let last10Percent = top10Percent

        if(top10Percent > 5 ){
            top10Percent = 5
            last10Percent = 5
        }
        for(let i = 0 ; i < top10Percent; i++){
            let pagePath = `${targetDir}/${i+1}.jpg`
            try {
                fs.unlinkSync(pagePath)
                
            } catch (error) {
                console.log(error)

            }
        }
        for(let j = 0; j < last10Percent; j++ ){
            let maxPage = allImages.length;
            let pagePath = `${targetDir}/${maxPage-(j+1)}.jpg`
            try {
                fs.unlinkSync(pagePath)
                
            } catch (error) {
                console.log(error)
            }
                }
    });

    console.log(dirToRemove)
    }
}

export default FilterResources;