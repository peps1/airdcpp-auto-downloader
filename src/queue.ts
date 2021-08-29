// requeue all items that are older than the search interval
export const requeueOldestSearches = async () => {

  const searchSchedule = global.SETTINGS.getValue('search_interval') * 60 * 1000;
  const requeueTime = Date.now() - ( searchSchedule * 2 );

  for (const item of global.SEARCH_HISTORY) {
    if (item.timestamp < new Date(requeueTime)) {
      // older than X minutes
      global.SEARCH_HISTORY.splice(global.SEARCH_HISTORY.indexOf(item), 1);
    }
  }

};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNextPatternFromItem = (queryItem: any, pos: number): [number, string]|undefined => {
  // read item list
  for (const [index, singlePattern] of queryItem.pattern_list.split('\n').entries()) {

    let skipItem = false;
    for (const item of global.SEARCH_HISTORY) {
      if (item.name.includes(singlePattern)) {
        // skip item if already in list
        skipItem = true;
      }
    }

    if (!skipItem) {

      // exit when string is empty
      if (singlePattern.trim().length === 0) {
        return;
      }

      global.SEARCH_HISTORY.push({
        name: singlePattern,
        timestamp: new Date()
      });
      return [index, singlePattern];
    }
  }
  return;
};

// remove item from search_items
export const removeSearchItemFromList = async (searchItem: string, listId: number) => {

  // get all search items from settings
  const settingsSearchItems = await global.SETTINGS.getValue('search_items');

  // turn items into array
  const items = settingsSearchItems[listId].pattern_list.split('\n');

  // remove matching item
  items.splice(items.indexOf(searchItem), 1);

  // turn items back to string
  const newPatternList = items.join('\n');

  // replace pattern list with new one
  settingsSearchItems[listId].pattern_list = newPatternList;

  // update settings
  await global.SETTINGS.setValue('search_items', settingsSearchItems);

};
