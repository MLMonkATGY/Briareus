import {PrimaryKey, Cascade, Collection, Entity, OneToMany, Property, ManyToOne } from '@mikro-orm/core';
import Doujinshi from '../Entity/Doujinshi.js';
@Entity()
class Author {
    @PrimaryKey()
    name: string;
    @Property()
    numOfWork:number = 0;
    
    @OneToMany(() => Doujinshi, doujin=>doujin.author)
    author : Doujinshi[]; 

    constructor(name:string){
        this.name = name;
    }

}
export default Author;