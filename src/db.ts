
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import { DBData } from 'types';


let dbObj: Low<DBData>;

const file = join(global.EXTENSION.logPath, 'db.json');

export const initLowDb = () => {

  const adapter = new JSONFile<DBData>(file);
  dbObj = new Low<DBData>(adapter);
    // Read data from JSON file, this will set db.data content
  dbObj.read();
  dbObj.data = dbObj.data || { search_history:  [] };

  return dbObj;

};

export const getLowDb = () => {

  if (!dbObj.data) {
    dbObj = initLowDb();
    return dbObj;
  } else {
    return dbObj;
  }

};



