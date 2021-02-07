import {PrimaryKey, Cascade, Collection, Entity, OneToMany, Property, ManyToOne } from '@mikro-orm/core';
import Doujinshi from '../Entity/Doujinshi.js';
@Entity()
class Channels {
    @PrimaryKey()
    name: string;
    @Property()
    url:string = "";
    
   
    constructor(name:string, url:string){
        this.name = name;
        this.url  = url;
    }

}
export default Channels;