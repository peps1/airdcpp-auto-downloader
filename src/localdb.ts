
import StormDB from 'stormdb';

export const getDb = async (dbFilePath: string) => {

  const engine = new StormDB.localFileEngine(dbFilePath, {async: true});
  const dbObj = new StormDB(engine);

  dbObj.default({ search_history:  [] });
  // Read data from JSON file, this will set db.data content

  return dbObj;

};
