import {NodeSSH} from 'node-ssh';
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import getEntityManager from "../Db/GetDbSettings.js"
import DistributedWorkers from '../Entity/DistributedWorkers.js';
import SshScheduler from "./SshScheduler.js"
import fs from "fs";
import { split } from 'ts-node';
import recursive from "recursive-readdir";
import {exec, execSync, spawn, spawnSync} from 'child_process';
import fetch from 'node-fetch'
// import eachLimit from 'async/eachLimit';
import async from "async";
class TriggerFunctionCompute implements iRepeatJobBase{
    private localEventData : Set<string>;
    private localEventDataList: Array<string>;
    private uploadedEventData: Array<string>;

    constructor() {
        this.localEventData = new Set()
        this.localEventDataList = []
        this.uploadedEventData = []

    }
    public waitFor = async (timeout: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true)
          }, timeout);
        })
      }
   

    public runFetch = (elem, baseUrl)=>{
        return new Promise((resolve,reject)=>{
            let payload = {
                sourcePath: `${elem}/output.mp4`
            }
            let cmd = "~/.aliyun-serverless/bin/fun.sh invoke distributed/splitvideo -e \'" + JSON.stringify(payload) + "\'"
            fetch(baseUrl, {method : "POST", body : JSON.stringify(payload)}).then(res => res.text()).then((resp)=>{
                console.log(resp)
                resolve(payload)

            }).catch(err=>{
                console.log(err)
            })
        })
    }

    public triggerFC = async(payload:Array<string>)=>{
        let count = 0;
        let allP = []
        // let totalCmd = ""
        let commands = []
        let start = Date.now()
        console.log(`Started ${start}`)

        setInterval(()=>{
            console.log(`Current progress ${count}/${payload.length} : ${count/payload.length}`)
        }, 5000)
        const base = "https://5138646860170696.ap-southeast-3.fc.aliyuncs.com/2016-08-15/proxy/httpWorker/splitvideo/"
        // const base = "http://localhost:8000/2016-08-15/proxy/httpWorker/splitvideo"
        // payload = fs.readdirSync("/home/alextay96/Desktop/workspace/3d-eff/Briareus/cloud/.fun/nas/auto-default/distributed/payloads/eventData")
        for (let i = 0 ; i < payload.length ; i++){
            allP.push(this.runFetch(payload[i],base))

            // allP.push(this.runSubProcess(elem))
            if((i + 1) % 250 == 0){
                await Promise.all(allP)
                count += allP.length
                allP = []
                
            }
        }
     
        let end = Date.now()
        console.log(`Elapsed ${end-start}`)
        console.log("======Done========")
    }
   
    public run =async (runAtStartup: boolean)=>{
       const em = await getEntityManager()
        const repo = em.getRepository<DistributedWorkers>(DistributedWorkers)
        let serverConn = await repo.findOne({name : {
            $eq : "alicloud"
        }})
        const ssh = new NodeSSH()
        await ssh.connect({
            host: serverConn.address,
            username: serverConn.username,
            port: serverConn.port,
            password: serverConn.password
        }).catch(err=>{
            console.log(`Connection Error ${serverConn.name}`)
            
        })
        let dirNum = 0
        await ssh.exec(`ls /mnt/auto/httpWorker/eventData | wc -l `, [], {
            cwd: '.',
            onStdout(chunk) {
                dirNum = Number(chunk.toString('utf8'))
                console.log(chunk.toString('utf8'))
            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
        });
        let allDirPath = ""
        await ssh.exec(`ls /mnt/auto/httpWorker/eventData `, [], {
            cwd: '.',
            onStdout(chunk) {
                allDirPath += chunk.toString('utf8')
                // console.log(chunk.toString('utf8'))
            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
        });
        let existedEventData = allDirPath.split("\n")
        await this.triggerFC(existedEventData)
        // console.log(allDirPath)
    };

}
export default TriggerFunctionCompute;