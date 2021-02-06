import { spawn } from "child_process";
import SocketStore from "Singleton/SocketStore";
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import { firefox, Browser, Page, BrowserContext, Request, Route } from "playwright";
import path  from "path";
import { EntityRepository, MikroORM } from "@mikro-orm/core";
import getEntityManager from "../Db/GetDbSettings.js";
import fs from "fs";
import Doujinshi from "../Entity/Doujinshi.js";
import Author from "../Entity/Author.js";
import _ from "underscore";
class GetThumbnailByAuthor implements iRepeatJobBase {
  private intervalUpdate: number;
  private socketStore: SocketStore;
  constructor() {

  }
  public linkStore = (store: SocketStore) => {
    this.socketStore = store;

  }
  public run = (runAtStartup: boolean) => {
    this.handler();

    
  };
  public getUserPrefString = (port:number)=>{
    return  `
    user_pref("browser.aboutwelcome.enabled", false);
    user_pref("network.proxy.socks", "127.0.0.1");
    user_pref("network.proxy.type", 1);
    user_pref("network.proxy.socks_port", ${port});
    user_pref("network.proxy.socks_remote_dns", true);  
    user_pref("network.proxy.socks_version", 5);
	`;
  }
  public generateBrowserContext = async(browserInstance : number):Promise<BrowserContext[]>=>{
    let tmpDir = "/home/alextay96/Desktop/workspace/dashboard_spy_nodejs_node/resources/tmp";
    let allBrowserContext :Array<BrowserContext> = [];
    const lowestPort = 8000 + browserInstance
    // let allOccupiedPorts = new Set() 
    fs.rmdirSync(tmpDir,  { recursive: true })
    let portNum = lowestPort + Math.round((Math.random()*100) % browserInstance)
    const ports = _.range(portNum,8000, -1)
    for(let i = 0 ;i < browserInstance; i++){
      let portNum = ports[i]
    
      
      let userPrefString = this.getUserPrefString(portNum)
      let userDataDir = tmpDir + `/${i}`
      fs.mkdirSync(userDataDir, { recursive: true });

      fs.writeFileSync(path.join(userDataDir, "user.js"), userPrefString);
      const browser : BrowserContext = await firefox.launchPersistentContext(
        userDataDir, {
            headless: true,
        });
      browser.setDefaultTimeout(60000)
      allBrowserContext.push(browser)
    }
    return allBrowserContext
  }

  public getAuthorWorkNum = async(page:Page,link:string, resolve, reject, repo:EntityRepository<Author>)=>{
    // const page = await browser.newPage();
    await this.waitFor(Math.round(Math.random()*500))
    const response  = page.goto(link, {waitUntil:"domcontentloaded"}).catch((e) => {
        if(e.message.includes("Navigation failed because page was closed!")){
          return
        }else{
          console.log("page does not exist");
          console.log(link);
          console.log(e)
          resolve(link)
          // await page.close()
          return
        }
        

    })
    let p2 = page.waitForSelector(".count", {state:"attached"})
    await Promise.race([response,p2])
    let totalWorks = await page.$$eval('.count', imgs => imgs.map(img => img.textContent))
    while(totalWorks.length == 0){
      await this.waitFor(100)
      console.log(`stuck in not rendered ${link}`)
      // await page.screenshot({path : "./notrendered.png"})
      totalWorks = await page.$$eval('.count', imgs => imgs.map(img => img.textContent))
    }
    if(response ){
      // let responseHttpCode = response.status()
      // if (responseHttpCode != 200) {
      //     console.log(responseHttpCode)
      //     resolve(link)
      //     return
      // }
      
      // const totalWorks = await page.$$eval('.count', imgs => imgs.map(img => img.textContent))
      const numOfWork = Number(totalWorks[0])
      if(isNaN(numOfWork)){
        // console.log(totalWorks)
        console.log(`this has empty totalWorks ${link}`)
        resolve(link)
        return
      }else{
        let temp = link.split("/")
        const  authorname = temp[temp.length - 1]
        
        let author = await repo.findOne({name : authorname})
        author.numOfWork =numOfWork
        await repo.persist(author)
        console.log(totalWorks)
        // await page.close()
        resolve(link)
      }
      
    }else{
      // await page.close()

    }

  }
  public waitFor = async(timeout:number)=>{
    return new Promise((resolve,reject)=>{
      setTimeout(() => {
        resolve(true)
      }, timeout);
    })
  }
public pageWorker = async(page:Page, link:string, repo:EntityRepository<Author>)=>{
  return new Promise((resolve, reject)=>{
    this.getAuthorWorkNum(page, link, resolve, reject, repo)
  })
}
  public interceptImages = async(page)=>{
     page.route('**/*', (route:Route) => {
      return route.request().resourceType() === 'image'
        ? route.abort()
        : route.continue()
    })
  }

  /**
   * pageScheduler
browser:BrowserContext, payload:string[]   */
  public pageScheduler = async(browser:BrowserContext, payload:string[])=> {
    return new Promise(async(resolve,reject)=>{
      const em = await getEntityManager()
      const repo = em.getRepository<Author>(Author);
      let allPromiseInCurrentRound = []
      let allPages :Page[]= []
      let pageOpened : number = 0;
      for(let i = 0 ; i < payload.length; i++){
        const link = payload[i] 
        const p = await browser.newPage()
        allPages.push(p)
        this.interceptImages(p)
        allPromiseInCurrentRound.push(this.pageWorker(p, link, repo))
        pageOpened++
      }
      console.log(`This browser opened ${pageOpened} pages`)
      let kk = await Promise.all(allPromiseInCurrentRound)
      let closingPromises = []
      for(let j = 0 ; j < allPages.length; j++){
        closingPromises.push(allPages[j].close())
      }
      await Promise.all(closingPromises).catch((err)=>{
        console.log(err)
      })
      await repo.flush()
      resolve(true)
    })


  }
  /**
   * pageScheduler
   */
  public makeRepeated = (arr, repeats) =>{
    return Array.from({ length: repeats }, () => arr);

  }
  

  public getAuthorDoujinshiNum = async(allBrowser:BrowserContext[], pagenum:number)=> {
    const em = await getEntityManager()
    const repo = em.getRepository<Author>(Author);
    const allAuthor = await repo.find( { numOfWork: 
    {  
      $in: [0],
     
    }
  });
    const baseUrl = "https://nhentai.net/artist/"
    const allAuthorLink = []
    allAuthor.forEach((author)=>{
      allAuthorLink.push(baseUrl + author["name"])
    })
    const totalPayloads = _.chunk(allAuthorLink, pagenum )
    let browserRole = this.makeRepeated(_.range(allBrowser.length),Math.round(totalPayloads.length / allBrowser.length))
    browserRole = _.flatten(browserRole)
    console.log(`packs of totalPayloads = ${totalPayloads.length}`)
    console.log(`req per payload = ${totalPayloads[0].length}`)

    let i = 0;
    while(i < totalPayloads.length){
      let allPromise = []

      for(let j = 0 ; j < allBrowser.length ; j++){
        const currentBrowser = allBrowser[browserRole[j]]
        //Deep copy the payload to avoid sometimes the payload is undefined due to async access
        const currentPayload = JSON.parse(JSON.stringify(totalPayloads[i]));
        try {
          let a = this.pageScheduler(currentBrowser, currentPayload)
          allPromise.push(a)
          i ++;
        } catch (error) {
          console.log(error)
          // i ++;

        }
        // allPromise.push(a)
        // console.log(`i = ${i}`)
      }
      console.log("waiting for this round of request to resolve")
      await Promise.all(allPromise)
      // await repo.flush()
      allPromise = []

    }

  }
  
  private handler = async () => {
    let allBrowser:BrowserContext[] = await this.generateBrowserContext(5)
    
    await this.getAuthorDoujinshiNum(allBrowser, 4);

    



  };

}
export default GetThumbnailByAuthor;
