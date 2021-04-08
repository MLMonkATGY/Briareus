import { spawn } from "child_process";
import SocketStore from "Singleton/SocketStore";
import iRepeatJobBase from "../Interfaces/IRepeatJobBase.interface";
import {default as blacklist} from "../../resources/interim/blackList.js";
import Author from "../Entity/Author.js";
import Doujinshi from "../Entity/Doujinshi.js";

import { MikroORM } from "@mikro-orm/core";
import Tags from "../Entity/Tags.js";

const SeedWhiteList = async()=> {
  const orm = await MikroORM.init({
    entities: [Author, Doujinshi, Tags],
    dbName: 'alextay96',
    type: 'postgresql',
    clientUrl: 'postgresql://alextay96@127.0.0.1:5432',
    user: 'alextay96',
    password: "Iamalextay96"
  });
  const em = orm.em.fork();
  let repo = em.getRepository<Author>(Author);

  const whiteList = blacklist["whitelist"];
  let a = new Set(whiteList)
  console.log(a.size)
  let allAuthors = []
  whiteList.forEach(async(element) => {
    let author = new Author(
       element
  )
  try {
    await repo.persist(author);
    
  } catch (error) {
    console.log(element)

  }

  });
  await repo.flush();


  // await em.persistAndFlush(allAuthors);

}
export default SeedWhiteList;
