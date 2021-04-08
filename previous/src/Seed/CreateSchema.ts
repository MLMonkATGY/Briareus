import { MikroORM } from '@mikro-orm/core';
import Author from "../Entity/Author.js";
import Doujinshi from "../Entity/Doujinshi.js";
import {default as settings} from "../Db/GetDbSettings.js"
import Tags from "../Entity/Tags.js";

import DoujinInfo from "../Entity/DoujinInfo.js";

import Channels from "../Entity/Channels.js";
import DistributedWorkers from "../Entity/DistributedWorkers.js";



const setupSchema = async () => {
  const orm = await MikroORM.init({
    entities: [  Channels,DistributedWorkers],
    dbName: 'alextay96',
    type: 'postgresql',
    clientUrl: 'postgresql://alextay96@127.0.0.1:5432',
    user: 'alextay96',
    password: "Iamalextay96"
  });
  const generator = orm.getSchemaGenerator();

  await generator.createSchema();

  await generator.updateSchema()
  await orm.close(true);
};
export default setupSchema;