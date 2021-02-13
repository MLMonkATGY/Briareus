import {NodeSSH} from 'node-ssh';
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import getEntityManager from "../Db/GetDbSettings.js"
import DistributedWorkers from '../Entity/DistributedWorkers.js';
import SshScheduler from "./SshScheduler.js"
import fs from "fs";
import { split } from 'ts-node';
class DownloadAndSplit implements iRepeatJobBase{
    constructor() {
    }
    public waitFor = async (timeout: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true)
          }, timeout);
        })
      }
    public worker = async(elem:DistributedWorkers, payload:string, resolve, reject)=>{
        const ssh = new NodeSSH()
        await ssh.connect({
            host: elem.address,
            username: elem.username,
            port: elem.port,
            password: elem.password
        }).catch(err=>{
            console.log(`Connection Error ${elem.name}`)
            resolve(payload)
            
        })
        const basePath = await ssh.exec(`pwd`, [], {
            cwd: '.',
            onStdout(chunk) {
                console.log(chunk.toString('utf8'))
            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
        });
    
        const workspacePath = `${basePath}/distributedWorkspace_${elem.name}_${Date.now()}`
        await ssh.execCommand(`mkdir -p ${workspacePath}`).catch(async err=>{
             await this.waitFor(2000)

        });
        // await this.waitFor(2000)
        console.log(`${elem.name} started youtube-dl`)
        let downloadedFilename = ""
       
        try {

            await ssh.exec(`youtube-dl ${payload} -f worst --restrict-filenames -o "%(title)s.%(ext)s"`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    // console.log(chunk.toString('utf8'))
                },
                onStderr(chunk) {
                    // console.log('stderrChunk', chunk.toString('utf8'))
                },
            }).catch(err=>{
                console.log(err)
                resolve(payload)
                
            });
            // await this.waitFor(1000)

            await ssh.exec(`ls -p | grep -v /`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    // console.log(chunk.toString('utf8'))
                    downloadedFilename = chunk.toString('utf8').replace("\n", "")
                },
                onStderr(chunk) {
                    // console.log('stderrChunk', chunk.toString('utf8'))
                },
            }).catch(err=>{
                // console.log(err)
            });
            // await this.waitFor(500)
            
            console.log(`Detected filename ${downloadedFilename} in ${elem.name}`)
            
            console.log(`${elem.name} started ffmpeg`)
            // await this.waitFor(1000)

            await ssh.mkdir(`${workspacePath}/${downloadedFilename}_payloads`).catch(async(err)=>{
                console.log(err)
                // await this.waitFor(2000)
                resolve(payload)
                
            })
            // await ssh.execCommand(`mkdir ${workspacePath}/payloads`);
            // await this.waitFor(1000)

            await ssh.exec(`ffmpeg -i ${downloadedFilename} -segment_time 00:00:20 -f segment -reset_timestamps 1 ${downloadedFilename}_payloads/output%03d.mp4`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    // console.log(chunk.toString('utf8'))
                },
                onStderr(chunk) {
                    // console.log('stderrChunk', chunk.toString('utf8'))
                },
            }).catch(err=>{
                // console.log(err)
            });
            

            console.log(`${elem.name} started transfering payload back`)
            const pathcomponents= workspacePath.split("_")
            const payloadPath = "/media/alextay96/Storage/distributed_jobs_payloads" + "/" + 
            pathcomponents[pathcomponents.length -2] + pathcomponents[pathcomponents.length -1]
            fs.mkdirSync(payloadPath)
            // await this.waitFor(1000)
            await ssh.getDirectory(payloadPath, `${workspacePath}/${downloadedFilename}_payloads`)
            // await this.waitFor(1000)

            await ssh.execCommand(`rm -r ${workspacePath}`)
            // await this.waitFor(1000)

            resolve(elem.name)
            console.log(`${elem.name} completed all ops`)
            console.log(`${elem.name} done`)
            // await this.waitFor(3000)

        } catch (error) {
            console.log(`${elem.name} encounter error. Rolling back fs`)
       
            reject(payload)
            // await this.waitFor(3000)

        }
       


       
    }
    public promiseInterface = (elem:DistributedWorkers, payload:string)=>{
        return new Promise((resolve, reject)=>{
            this.worker(elem, payload, resolve, reject)
        })
    }
    public workloadDistributions = (allWorkloads, numOfWorkers:number)=>{
        let distributedWorkloads:Array<Array<string>>= []
        for (let i = 0 ; i < numOfWorkers; i++){
            distributedWorkloads.push([])
        }
        allWorkloads.forEach((element, index) => {
            distributedWorkloads[index%numOfWorkers].push(element)
        });
        return distributedWorkloads
    }

    public run =async (runAtStartup: boolean)=>{
        const em = await getEntityManager()
        const repo = em.getRepository<DistributedWorkers>(DistributedWorkers)
        const allWorkerConnection = await repo.findAll()
        let allConnPromise = []
        const payloadFile = "/home/alextay96/Desktop/workspace/3d-eff/Briareus/python-tools/coherent-split01.txt"
        let allLines = fs.readFileSync(payloadFile).toString().split("\n").filter(elem=>elem!="")
        // console.log(allLines)
        const workload =allLines
        const workerNum = 2
        // console.log(workload)
        let allWaitingPromise :  Array<Promise<any>> = []
        let KPI = {}
        let namedWorks = {}
        let nameIdMapping = {}
        allWorkerConnection.forEach((elem, index)=>{
            nameIdMapping[index] = elem.name
            KPI[elem.name] = 0
            namedWorks[elem.name] = index
        })
        setInterval(()=>{
            console.log(KPI)
        },5000)
        let previous = 0
        let fastestData = ""
        let latest = 0
        console.log(namedWorks)
        let schedule = [2, 0, 1, 0, 1, 1, 0 ,1]
        let loadBalance  = new Array(workload.length).fill(schedule).flat();

        for(let j = 0 ; j < workload.length ; j++){
            allWaitingPromise.push(this.promiseInterface(allWorkerConnection[loadBalance[j]], workload[j]))
            if(j != 0 && (j) % schedule.length == 0){
                const allResponse = await Promise.all(allWaitingPromise)
                allResponse.forEach((elem:string)=>{
                    if(elem.includes("http")){
                        workload.push(elem)
                        
                    }else{
                        KPI[elem] += 1

                    }

                })
                allWaitingPromise = []
                console.log("===All clear====")
            }
        }

    

        }

        // allWorkerConnection.forEach(async (elem:DistributedWorkers)=>{
        //     allConnPromise.push(this.initInitialConn(elem))
        // })
      
      
      

    };


export default DownloadAndSplit;