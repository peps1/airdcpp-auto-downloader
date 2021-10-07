import { getIndexForPattern } from 'utils';
import { getDb } from './localdb';
import { SearchHistory, SearchItem, SearchPatternItem } from './types';


export const getSearchPattern = async () => {

  let pattern: undefined|SearchPatternItem;

  while (!pattern) {
    // iterate search lists
    for (let searchItemId = 0; searchItemId < global.SETTINGS.getValue('search_items').length; searchItemId++) {
      const searchItem = global.SETTINGS.getValue('search_items')[searchItemId];

      // skip empty searchItems
      if (!searchItem.pattern_list) { break; };

      // get single search pattern from search item
      pattern = await getNextPatternFromItem(searchItem, searchItemId);
      if (!pattern) {
        // if no pattern found, we check the next search item / list
        continue;
      } else {
        return pattern;
      }
    }

    // all patterns from all search items were searched, we'll continue from the oldest
    const oldest = await getOldestSearchHistory();

    if (!oldest) { return; };

    pattern = {
      searchItemId: oldest.searchItemId,
      patternIndex: oldest.patternIndex,
      singlePattern: oldest.pattern
    };
  }

  return pattern;

};

// process single search item
export const getNextPatternFromItem = async (searchItem: SearchItem, searchItemId: number): Promise<SearchPatternItem | undefined> => {
  // read item list
  for (const [patternIndex, singlePattern] of searchItem.pattern_list.split('\n').entries()) {

    let skipItem = false;

    // iterate over search history
    const db = await getDb(global.DbPath);

    // we skip the item if it's in the db already
    if (db.get('search_history').value().some( (item: SearchHistory) => item.pattern === singlePattern)) {
      skipItem = true;
    }

    if (!skipItem) {

      // skip when string is empty
      if (singlePattern.trim().length === 0) {
        continue;
      }

      return {searchItemId, patternIndex, singlePattern};
    }
  }
  return;
};

// remove item from search_items
export const removeSearchPatternFromList = async (searchPattern: string, searchItemId: number) => {

  // get all search items from settings
  const settingsSearchItems = await global.SETTINGS.getValue('search_items');

  // turn items into array
  const items = settingsSearchItems[searchItemId].pattern_list.split('\n');

  // remove matching item
  items.splice(items.indexOf(searchPattern), 1);

  // turn items back to string
  const newPatternList = items.join('\n');

  // replace pattern list with new one
  settingsSearchItems[searchItemId].pattern_list = newPatternList;

  // update settings
  await global.SETTINGS.setValue('search_items', settingsSearchItems);

};

const getOldestSearchHistory = async () => {

  const db = await getDb(global.DbPath);

  let result: SearchHistory|undefined;

  while (!result) {

    // db might be empty
    if (!db.get('search_history').value().length) { return; };

    // iterate items, leaving only the oldest
    const oldest = (db.get('search_history').value() as SearchHistory[]).reduce((prev, cur) => cur.timestamp < prev.timestamp ? cur : prev);

    // iterate through settings search_items
    let isOrphanedRecord = false;
    for (const searchItem of (global.SETTINGS.getValue('search_items') as SearchItem[])) {

      // if found, return result
      if (searchItem.pattern_list.split('\n').some((pattern) => pattern === oldest.pattern)) {
        result = oldest;
        db.save();
        return result;
      } else {
        // use variable so we iterate through everything before deciding if it should be deleted
        isOrphanedRecord = true;
      }
    }

    if (isOrphanedRecord) {
      // remove from db
      const index = getIndexForPattern(db.get('search_history').value(), oldest);
      try {
        db.get('search_history').get(index).delete(true);
        global.SOCKET.logger.verbose('Deleted orphaned record from db..');
        global.SOCKET.logger.verbose(db.get('search_history').value());
      } catch {
        global.SOCKET.logger.error('Problem Deleting orphaned record from db..');
        return;
      }

    }

  }
  return;

};

