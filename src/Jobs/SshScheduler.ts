import {NodeSSH} from 'node-ssh';
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import getEntityManager from "../Db/GetDbSettings.js"
import DistributedWorkers from '../Entity/DistributedWorkers.js';


class SshScheduler implements iRepeatJobBase {
    constructor() {
        
    }
    public waitFor = async (timeout: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true)
          }, timeout);
        })
      }
    public initInitialConn = async(elem:DistributedWorkers)=>{
        const ssh = new NodeSSH()

        await ssh.connect({
            host: elem.address,
            username: elem.username,
            port: elem.port,
            password: elem.password
        })
        await ssh.execCommand("touch initialConn.txt");
        await ssh.exec("echo \" Hello world\" >> initialConn.txt", [], {
            cwd: '.',
            onStdout(chunk) {
                console.log(chunk.toString('utf8'))
            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
        });
    }

    public run =async (runAtStartup: boolean)=>{
        const em = await getEntityManager()
        const repo = em.getRepository<DistributedWorkers>(DistributedWorkers)
        const allWorkerConnection = await repo.findAll()
        let allConnPromise = []
        allWorkerConnection.forEach(async (elem:DistributedWorkers)=>{
            allConnPromise.push(this.initInitialConn(elem))
        })
        await Promise.all(allConnPromise)
        console.log("Done")
      
      

    };

}
export default SshScheduler;