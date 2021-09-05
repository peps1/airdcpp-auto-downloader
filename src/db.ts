
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import { DBData } from 'types';


export default (extension: any) => {

  const file = join(extension.logPath, 'db.json');
  const adapter = new JSONFile<DBData>(file);
  const db = new Low<DBData>(adapter);

  // Read data from JSON file, this will set db.data content
  db.read();
  db.data = db.data || { search_history:  [] };

  db.write();
  // eslint-disable-next-line no-console
  console.log(db.data);
  return db;

};


