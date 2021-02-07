import { firefox, Browser, Page, BrowserContext, Request, Route } from "playwright";
import { Connection, EntityManager, EntityRepository, IDatabaseDriver, MikroORM } from "@mikro-orm/core";

interface iCrawlerJob {
    dbOrmConnection:any;
    saveToDbInterval : number;
    orm:any;
    repo : any;
    closePageEachRequest : boolean
    setOrmConn():Promise<MikroORM<IDatabaseDriver<Connection>>>;
    generateBrowserContext(browserInstance: number, headless:boolean): Promise<BrowserContext[]>;
     topLevelTaskScheduler():Promise<any>
    atomicPageLevelExecutor(page: Page, link: string, resolve, reject, repo):Promise<any>
    persistConfig():void
  }
  export default iCrawlerJob;
  