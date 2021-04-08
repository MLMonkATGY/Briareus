import {PrimaryKey, Cascade, Collection, Entity, OneToMany, Property, ManyToOne, Unique } from '@mikro-orm/core';
import Doujinshi from '../Entity/Doujinshi.js';
@Entity()
class DistributedWorkers {
    @PrimaryKey()
    id!: number;
    @Property()
    password:string = "";
    @Property()
    address:string;
    @Property()
    name:string;
    @Property()
    port:number;
    @Property()
    username:string;
    constructor(name:string, password:string, port:number, address:string, username : string){
        this.name = name;
        this.password  = password;
        this.port  = port;
        this.address  = address;
        this.username  = username;

    }

}
export default DistributedWorkers;