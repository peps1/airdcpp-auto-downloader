
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import { DBData } from './types';


let dbObj: Low<DBData>;


// TODO: fix path
const file = join('/tmp', 'db.json');

export const initLowDb = async () => {

  const adapter = new JSONFile<DBData>(file);
  dbObj = new Low<DBData>(adapter);
    // Read data from JSON file, this will set db.data content
  await dbObj.read();
  console.log(dbObj.data);
  dbObj.data = dbObj.data || { search_history:  [] };

  return dbObj;

};

export const getLowDb = async () => {

  await dbObj.read();
  return dbObj;

};



