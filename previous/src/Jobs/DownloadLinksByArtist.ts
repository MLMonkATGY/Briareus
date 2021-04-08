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
class PreviewThumbnail implements iRepeatJobBase {
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
  public generateBrowserContext = async (browserInstance: number): Promise<BrowserContext[]> => {
    let tmpDir = "/home/alextay96/Desktop/workspace/dashboard_spy_nodejs_node/resources/tmp";
    let allBrowserContext: Array<BrowserContext> = [];
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
      const browser: BrowserContext = await firefox.launchPersistentContext(
        userDataDir, {
        headless: true,
      });
      browser.setDefaultTimeout(60000)
      allBrowserContext.push(browser)
    }
    return allBrowserContext
  }

  public getAuthorWorkNum = async (page: Page, link: string, resolve, reject, repo: EntityRepository<Doujinshi>, cacheEm: EntityManager) => {
    // const page = await browser.newPage();
    await this.waitFor(Math.round(Math.random() * 500))

    // const em = await getEntityManager()
    const authorRepo = cacheEm.getRepository<Author>(Author);
    const response = await page.goto(link, { waitUntil: "domcontentloaded" }).catch((e) => {
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
    // let p2 = page.waitForSelector("div.gallery", {state:"attached"})
    // await Promise.race([response,p2])
    let authorname = await page.$eval('.name', html => html.textContent)
    // if(authorname.includes(".")){
    //   authorname = authorname.replace(".", "")
    // }
    authorname = authorname.replace(".", "").replace(/\s/g, "-")

    // const authorP =  authorRepo.findOne(
    //   {name :
    //     {
    //   $eq: authorname
    //     }
    //   }
    // ,)
    const author = await cacheEm.findOne(Author, {
      name:
      {
        $eq: authorname
      }
    }, { cache: 10000 })
    let hrefP = page.$$eval('div.container > div > a', imgs => imgs.map(img => img.getAttribute("href")))
    let thumbnailP = page.$$eval('div.container > div > a > img', imgs => imgs.map(img => img.getAttribute("data-src")))
    let nameP = page.$$eval('div.container > div > a > div', imgs => imgs.map(img => img.textContent))

    // let authorName = 
    let [totalWorks, allThumbnailLinks, doujinName] = await Promise.all([hrefP, thumbnailP, nameP])
    if (!author) {
      console.log(author)
    }
    
    if (response) {
      const doujinshiInfo = _.zip(totalWorks, allThumbnailLinks, doujinName)
      for (let i = 0; i < doujinshiInfo.length; i++) {
        const url: string = doujinshiInfo[i][0]
        const thumbnailLink = doujinshiInfo[i][1]
        const doujinName = doujinshiInfo[i][2]

        const id = Number(url.replace("/g/", "").replace("/", ""))
        if(id == undefined){
          console.log("undefined id")
          reject(true)
        }
        const dupCount = await repo.count({
          id: {
            $eq: id
          }
        })
        if (dupCount == 0) {
          const entry = new Doujinshi(id, doujinName, thumbnailLink, author)
          await repo.persist(entry)
          console.log(`Successful ${id}`)
        } else {
          console.log(`Duplicate ${id}`)

        }

      }
      resolve(true)




    } else {
      // await page.close()

    }

  }
  public waitFor = async (timeout: number) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, timeout);
    })
  }
  public pageWorker = async (page: Page, link: string, repo: EntityRepository<Doujinshi>, cacheEm) => {
    return new Promise((resolve, reject) => {
      this.getAuthorWorkNum(page, link, resolve, reject, repo, cacheEm)
    })
  }
  public interceptImages = async (page) => {
    page.route('**/*', (route: Route) => {
      return route.request().resourceType() === 'image'
        ? route.abort()
        : route.continue()
    })
  }

  /**
   * pageScheduler
browser:BrowserContext, payload:string[]   */
  public pageScheduler = async (browser: BrowserContext, payload: string[], author: Author) => {
    return new Promise(async (resolve, reject) => {
      const em = await getEntityManager()
      const repo = em.getRepository<Doujinshi>(Doujinshi);
      let allPromiseInCurrentRound = []
      let allPages: Page[] = []
      let pageOpened: number = 0;
      for (let i = 0; i < payload.length; i++) {
        const link = payload[i]
        const p = await browser.newPage()
        allPages.push(p)
        this.interceptImages(p)
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
      await repo.flush().catch(err=>{
        console.log("Flush reject")
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



  public getAuthorPageNum = async (allArtist: Author[]): Promise<{ [key: string]: number }> => {
    // const em = await getEntityManager()
    // const repo = em.getRepository<Author>(Author);
    // const allArtist = await repo.findAll();
    let artistPageNum = {}
    allArtist.forEach(elem => {
      let maxPageNum = Math.ceil(elem.numOfWork / 25)
      artistPageNum[elem.name] = maxPageNum
    })
    return artistPageNum

  }

  public getThumbnails = async (allBrowser: BrowserContext[], pagenum: number, payloads: { url: string, author: Author }[]) => {
    const payloadLinks = payloads.map(elem => elem.url)
    const payloadAuthor = payloads.map(elem => elem.author)

    const totalPayloads = _.chunk(payloadLinks, pagenum)

    let browserRole = this.makeRepeated(_.range(allBrowser.length), Math.round(totalPayloads.length / allBrowser.length))
    browserRole = _.flatten(browserRole)
    console.log(`packs of totalPayloads = ${totalPayloads.length}`)
    console.log(`req per payload = ${totalPayloads[0].length}`)

    let i = 0;
    while (i < totalPayloads.length) {
      let allPromise = []

      for (let j = 0; j < allBrowser.length; j++) {
        //Deep copy the payload to avoid sometimes the payload is undefined due to async access
        try {
          const currentBrowser = allBrowser[browserRole[j]]

          const currentPayload = JSON.parse(JSON.stringify(totalPayloads[i]));

          let a = this.pageScheduler(currentBrowser, currentPayload, payloadAuthor[i])
          allPromise.push(a)
          i++;
        } catch (error) {
          console.log(error)
          continue          

        }
        // allPromise.push(a)
        // console.log(`i = ${i}`)
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
    // let allBrowser:BrowserContext[] = await this.generateBrowserContext(10)
    const em = await getEntityManager()
    const repo = em.getRepository<Author>(Author);
    const allArtist = await repo.findAll();
    const artistPageNum = await this.getAuthorPageNum(allArtist);
    let payloads = []
    let index = 0
    for (const [key, value] of Object.entries(artistPageNum)) {
      _.range(1, value).forEach(elem => {
        let url = `https://nhentai.net/artist/${key}/?page=${elem}`
        payloads.push({
          "url": url,
          "artist": allArtist[index]

        })
      })
      index++;

    }
    console.log(payloads)
    let allBrowser: BrowserContext[] = await this.generateBrowserContext(5)
    await this.getThumbnails(allBrowser, 4, payloads)
    console.log("=================All DONE===========================")




  };

}

export default PreviewThumbnail;
