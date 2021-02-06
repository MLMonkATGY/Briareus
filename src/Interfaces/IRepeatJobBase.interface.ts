interface iRepeatJobBase {
  run(runAtStartup: boolean): any;
  linkStore(store: any): void;
}
export default iRepeatJobBase;
