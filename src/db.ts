
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import { DBData } from 'types';


export const lowDb = (extension: any) => {

  const file = join(extension.logPath, 'db.json');
  const adapter = new JSONFile<DBData>(file);
  const db = new Low<DBData>(adapter);

  // Read data from JSON file, this will set db.data content
  db.read();
  db.data = db.data || { search_history:  [] };

  return db;

};


