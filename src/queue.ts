/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getLowDb } from './db';
import { SearchHistory, SearchPatternItem } from './types';


export const getSearchPattern = async () => {

  let pattern: undefined|SearchPatternItem;

  while (!pattern) {
    // iterate search lists
    for (let searchItemId = 0; searchItemId < global.SETTINGS.getValue('search_items').length; searchItemId++) {
      const searchItem = global.SETTINGS.getValue('search_items')[searchItemId];

      // skip empty searchItems
      if (!searchItem.pattern_list) { break; };

      pattern = await getNextPatternFromItem(searchItem, searchItemId);
      if (!pattern) {
        break;
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

export const getNextPatternFromItem = async (searchItem: any, searchItemId: number): Promise<SearchPatternItem | undefined> => {
  // read item list
  for (const [patternIndex, singlePattern] of searchItem.pattern_list.split('\n').entries()) {

    let skipItem = false;

    // iterate over search history
    const db = await getLowDb();

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

const getOldestSearchHistory = async () => {

  const db = await getLowDb();

  const data: SearchHistory[] = db.data!.search_history;
  if (!data.length) { return; };
  const result = data.reduce((prev, cur) => cur.timestamp < prev.timestamp ? cur : prev);

  const indexOfOldest = data.findIndex((item) => item.pattern === result.pattern);

  db.data!.search_history.splice(indexOfOldest, 1);


  // TODO: make sure oldest is also still in settings!


  db.write();

  // eslint-disable-next-line no-console
  console.log(`oldest search item is: ${JSON.stringify(result)}`);
  return result;
};

