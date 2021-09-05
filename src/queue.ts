/* eslint-disable @typescript-eslint/no-non-null-assertion */

// requeue all items that are older than the search interval
export const requeueOldestSearches = async () => {

  const searchSchedule = global.SETTINGS.getValue('search_interval') * 60 * 1000;
  const requeueTime = Date.now() - ( searchSchedule * 2 );

  for (const item of global.DB.data.search_history) {
    if (item.timestamp < new Date(requeueTime)) {
      // older than X minutes
      global.DB.data.search_history.splice(global.DB.data.search_history.indexOf(item), 1);
    }
  }

};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNextPatternFromItem = (queryItem: any, listId: number): [number, string]|undefined => {
  // read item list
  for (const [index, singlePattern] of queryItem.pattern_list.split('\n').entries()) {

    let skipItem = false;

    global.DB.read();
    // eslint-disable-next-line no-console
    console.log(global.DB.data);

    for (const item of global.DB.data.search_history) {
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

      global.DB.data.search_history.push({
        name: singlePattern,
        timestamp: new Date(),
        listid: listId
      });
      global.DB.write();
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
