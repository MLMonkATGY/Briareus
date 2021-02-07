class Queue {
    public set = new Set()
    public list = []
    public waiting = []
    public allDone = []

    constructor() {

    }
    public push = (item)=> {

        if (!this.set.has(item)) {
            if (this.waiting.length > 0) {
                let nextInLine = this.waiting.pop()
                    // nextInLine.resolve(item)
                nextInLine(item)
                this.allDone.push(item)
            } else {
                this.set.add(item)
                this.list.push(item)
            }

        }
    }
    public pop = async()=> {
        if (this.list.length > 0) {
            let payload = this.list.shift()
            this.set.delete(payload)
            this.allDone.push(payload)
            return new Promise((res, rej) => {
                res(payload)
            })
        } else {
            let gen = new Promise((resolve, reject) => {
                    // console.log("in promise")
                    this.waiting.push(resolve)
                        // console.log(this.waiting.length)
                })
                // this.waiting.push(gen)
            return gen
        }
    }
}
export default Queue;