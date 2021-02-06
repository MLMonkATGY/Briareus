import {PrimaryKey, Cascade, Collection, Entity, OneToMany, Property, ManyToOne, ManyToMany } from '@mikro-orm/core';
import Author from '../Entity/Author.js';
import Tags from '../Entity/Tags.js';

@Entity()
class Doujinshi {
    @PrimaryKey()
    id: number;
    @Property()
    name:string;
    @Property()
    thumbnail:string;
    @Property({nullable:true})
    pagenum:number = 0;
    // @Property()
    // tags : string = "";
    @ManyToOne(() => Author)
    author : Author; 
    // @ManyToMany(()=>Tags, tags=>tags.doujinshi,{owner:true})
    @Property()
    tags : string[] = [];
    constructor(id:number, name:string, thumbnail:string , author : Author){
        this.id = id;
        this.name = name;
        this.thumbnail = thumbnail;
        this.author = author;

    }
}
export default Doujinshi;