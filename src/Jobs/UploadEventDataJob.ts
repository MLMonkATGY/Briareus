import {NodeSSH} from 'node-ssh';
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import getEntityManager from "../Db/GetDbSettings.js"
import DistributedWorkers from '../Entity/DistributedWorkers.js';
import SshScheduler from "./SshScheduler.js"
import fs from "fs";
import { split } from 'ts-node';
import recursive from "recursive-readdir";
class UploadEventDataJob implements iRepeatJobBase{
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
            let displayCount = 0
            await ssh.exec(`youtube-dl ${payload} -f worst --restrict-filenames -o "%(title)s.%(ext)s"`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    displayCount++
                    if(displayCount %20 == 0){
                        console.log(chunk.toString('utf8'))

                    }
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
            let durationStr = ""
            await ssh.exec(`ffmpeg -i ${downloadedFilename} 2>&1 | grep Duration | awk '{print $2}' | tr -d ,`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    // console.log()
                    durationStr = chunk.toString('utf8').split(".")[0]
                },
                onStderr(chunk) {
                    // console.log('stderrChunk', chunk.toString('utf8'))
                },
            }).catch(err=>{
                // console.log(err)
            });
            let timeComponent = durationStr.split(":").map(elem=>{
                return Number(elem)
            })
            let startTimeStr = "00:20:00"
            if(timeComponent[0] < 3){
                let minutes = timeComponent[1] -20

                if(minutes < 0 && timeComponent[0] > 0){
                    timeComponent[0] -= 1
                    timeComponent[1] = 60 + timeComponent[1] - 20
                }
            }else{
                startTimeStr = "00:45:00"
                timeComponent[0] = 2
                timeComponent[1] = 30
                
            }
            
            let endTimeString = timeComponent.join(":")
            console.log(`End time in ${elem.name} vid : ${endTimeString}`)
            await ssh.exec(`ffmpeg -ss ${startTimeStr} -to ${endTimeString}  -i ${downloadedFilename} -segment_time 00:00:20 -f segment -reset_timestamps 1 ${downloadedFilename}_payloads/output%03d.mp4`, [], {
                cwd: workspacePath,
                onStdout(chunk) {
                    displayCount++
                    if(displayCount %10 == 0){
                        console.log(chunk.toString('utf8'))

                    }                },
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

    public ignoreFunc = (file, stats) =>{
    // `file` is the path to the file, and `stats` is an `fs.Stats`
    // object returned from `fs.lstat()`.
    return stats.isDirectory()
    }
    public localFileResourceWatcher = async()=>{
        const basePath = "/media/alextay96/Storage/distributed_jobs_payloads"
        let a = await recursive(basePath)
        a.forEach(element => {
            if(  !this.localEventData.has(element)){
                this.localEventData.add(element)
                this.localEventDataList.push(element)
            }   

        });
        console.log(this.localEventDataList.length)

    }
    public uploadFile = async(sshConn : NodeSSH, sourceFile, targetDir)=>{
        await sshConn.putFile(sourceFile, targetDir).catch(err=>{
            console.log(err)
        })
    }
    public uploadProgressLogger = ()=>{
        console.log(`Detected file : ${this.localEventData.size}`)
        console.log(`Pending upload file : ${this.localEventDataList.length}`)
        console.log(`Successfully uploaded file : ${this.uploadedEventData.length}`)
        console.log(`Uploaded percentage : ${this.uploadedEventData.length/this.localEventData.size}`)

    }
    public uploadWorker = async(sshConn : NodeSSH)=>{
        const parallelUploadNum = 5
        let allP = []
        for(let i = 0 ; i < parallelUploadNum ; i++){
            let source = this.localEventDataList.pop()
            let pathComp = source.split("/")
            let filename = pathComp[pathComp.length - 1]
            let targetDirName = pathComp[pathComp.length - 2] + "_" + filename.split(".")[0]
            let targetBaseDir = `/mnt/auto/distributed/eventData/${targetDirName}/output.mp4`
            allP.push(this.uploadFile(sshConn, source,targetBaseDir))
            this.uploadedEventData.push(source)
        }
        await Promise.all(allP)
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
        const basePath = await ssh.exec(`pwd`, [], {
            cwd: '.',
            onStdout(chunk) {
                console.log(chunk.toString('utf8'))
            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
        });
        await this.localFileResourceWatcher()
        setInterval(this.localFileResourceWatcher, 10000)
        setInterval(this.uploadProgressLogger, 10000)
        
        while(this.localEventDataList.length > 0){
            await this.uploadWorker(ssh)
        }
        
    };

}
export default UploadEventDataJob;