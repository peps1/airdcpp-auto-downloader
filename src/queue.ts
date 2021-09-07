/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getLowDb } from './db';
import { SearchHistory, SearchPatternItem } from './types';


export const getSearchPattern = async () => {

  const searchItemLength = global.SETTINGS.getValue('search_items').length;

  // eslint-disable-next-line no-console
  console.log(searchItemLength);
  let pattern: undefined|SearchPatternItem;

  while (!pattern) {
    // iterate search lists
    for (let searchItemId = 0; searchItemId < global.SETTINGS.getValue('search_items').length; searchItemId++) {
      const searchItem = global.SETTINGS.getValue('search_items')[searchItemId];
      pattern = getNextPatternFromItem(searchItem, searchItemId);
      if (!pattern) {
        break;
      } else {
        return pattern;
      }
    }

    // eslint-disable-next-line no-console
    console.log('need to find oldest..');

    // all patterns from all search items were searched, we'll continue from the oldest
    const oldest = getOldestSearchHistory();

    pattern = {
      searchItemId: oldest.searchItemId,
      patternIndex: oldest.patternIndex,
      singlePattern: oldest.pattern
    };
  }

  return pattern;

};

export const getNextPatternFromItem = (searchItem: any, searchItemId: number): SearchPatternItem|undefined => {
  // read item list
  for (const [patternIndex, singlePattern] of searchItem.pattern_list.split('\n').entries()) {

    let skipItem = false;

    // iterate over search history

    const db = getLowDb();

    if (db.data!.search_history.some( (i: any) => i.pattern === singlePattern)) {
      skipItem = true;
    }

    if (!skipItem) {

      // exit when string is empty
      if (singlePattern.trim().length === 0) {
        return;
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

const getOldestSearchHistory = () => {

  const db = getLowDb();

  const data: SearchHistory[] = db.data!.search_history;
  const result = data.reduce((prev, cur) => cur.timestamp < prev.timestamp ? cur : prev);

  const indexOfOldest = data.findIndex((item) => item.pattern === result.pattern);

  db.data!.search_history.splice(indexOfOldest, 1);


  // make sure oldest is also still in settings!
  // don't search empty strings


  db.write();

  // eslint-disable-next-line no-console
  console.log(`oldest search item is: ${JSON.stringify(result)}`);
  return result;
};

