interface iControllerBase {
  router:any;
  initRoutes(): any;
  linkStore(store: any): void;
  linkEventEmitter(manager: any): void;

}
export default iControllerBase;
