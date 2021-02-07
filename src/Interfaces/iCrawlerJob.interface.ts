import { firefox, Browser, Page, BrowserContext, Request, Route } from "playwright";

interface iCrawlerJob {
    dbOrmConnection:any;
    saveToDbInterval : number;
    generateBrowserContext(browserInstance: number, headless:boolean): Promise<BrowserContext[]>;
     topLevelTaskScheduler():Promise<any>
    atomicPageLevelExecutor(page: Page, link: string, resolve, reject):Promise<any>
  }
  export default iCrawlerJob;
  