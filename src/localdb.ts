
import { printEvent } from './log';
import StormDB from 'stormdb';
import { SeverityEnum } from 'types/api';

export const getDb = async (dbFilePath: string) => {

  try {
    const engine = new StormDB.localFileEngine(dbFilePath, {async: true});
    const dbObj = new StormDB(engine);
    dbObj.default({
      search_history:  [],
    });

    return dbObj;
  } catch (e) {
    printEvent(`${e}`, SeverityEnum.ERROR);
    throw (e);
  }




};
