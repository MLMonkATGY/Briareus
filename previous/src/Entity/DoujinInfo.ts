import {PrimaryKey, Cascade, Collection, Entity, OneToMany, Property, ManyToOne, ManyToMany } from '@mikro-orm/core';
import Author from '../Entity/Author.js';
import Tags from '../Entity/Tags.js';

@Entity()
class DoujinInfo {
    @PrimaryKey()
    id: number;
    
    @Property()
    pagenum:number = 0;
    @Property()
    tags:string[]  = [];
    @Property()
    language:string[]  = [];
    @Property()
    parodies:string[]  = [];


    constructor(id:number, pagenum:number, tags:string[], language:string[], parodies:string[]){
        this.id = id;
        this.pagenum = pagenum;
        this.language = language;
        this.tags = tags;
        this.parodies = parodies
    }
}
export default DoujinInfo;