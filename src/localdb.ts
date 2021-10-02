
import { join } from 'path';
import StormDB from 'stormdb';

export const getDb = async (dbFilePath: string) => {

  // TODO: fix path
  const file = join(dbFilePath);

  const engine = new StormDB.localFileEngine(file, {async: true});
  const dbObj = new StormDB(engine);

  dbObj.default({ search_history:  [] });
  // Read data from JSON file, this will set db.data content

  return dbObj;

};
