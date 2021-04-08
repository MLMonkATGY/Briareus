import {PrimaryKey, Entity, ManyToMany } from '@mikro-orm/core';
import Doujinshi from '../Entity/Doujinshi.js';

@Entity()
class Tags {
    @PrimaryKey()
    name: string;
  
    // @ManyToMany(() => Doujinshi, doujin=>doujin.tags)
    // doujinshi : Doujinshi[]; 
    constructor( name:string){
        this.name = name;

    }
}
export default Tags;