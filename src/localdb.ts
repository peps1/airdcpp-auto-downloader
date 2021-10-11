
import StormDB from 'stormdb';

export const getDb = async (dbFilePath: string) => {

  try {
    const engine = new StormDB.localFileEngine(dbFilePath, {async: true});
    const dbObj = new StormDB(engine);
    dbObj.default({
      search_history:  [],
    });

    return dbObj;
  } catch (e) {
    global.SOCKET.logger.error('ERROR: Problem loading db file');
    throw (e);
  }




};
