import { printEvent } from './log';
import * as utils from './utils';

const onSearchResultAdded = (results: any[], result: any) => {
  results.push(result.result);
};

const onSearchResultUpdated = (results: any[], result: any) => {
  const toReplaceIndex = results.findIndex((element: any) => {
    return element.id === result.result.id;
  });
  results[toReplaceIndex] = result.result;
};

export const searchItem = async () => {
  // Anything to search for?
  const itemCount = global.SETTINGS.getValue('search_items').length;
  if (itemCount === 0) {
    return;
  }

  // Get a random item to search for
  // TODO: pick random item, check item against recently searched list, if on list pick another, add item to list of recently searched (save in settings.json)
  // TODO: iterate through whole item list per search_interval
  const pos = Math.floor(Math.random() * itemCount);

  const item = global.SETTINGS.getValue('search_items')[pos];

  // The item might actually be a list of items

  // Get next item to search
  let pattern = getNextPatternFromItem(item, pos);

  if (!pattern) {
    requeueOldestSearches();
    // Get next item to search
    pattern = getNextPatternFromItem(item, pos);
    if (!pattern) {
      return;
    }
  }

  // Create search instance, expires after 10 minutes
    const instance: any = await global.SOCKET.post('search', {
      expiration: 10
  });

  // Save the results
  const results: any = [];

  // build search payload
  const query = utils.buildSearchQuery(item, pattern[0]);

  // add result listener
  const removeResultAddedListener = await global.SOCKET.addListener(
    'search',
    'search_result_added',
    (searchResult: any) => {
      onSearchResultAdded(results, searchResult);
    }, instance.id
  );

  const removeResultUpdatedListener = await global.SOCKET.addListener(
    'search',
    'search_result_updated',
    (searchResult: any) => {
      onSearchResultUpdated(results, searchResult);
    }, instance.id
  );

  const removeOnSearchSentListener = await globalThis.SOCKET.addListener(
    'search',
    'search_hub_searches_sent',
    (searchInfo: any) => {
      const listeners: any[] = [
        removeOnSearchSentListener,
        removeResultAddedListener,
        removeResultUpdatedListener
      ];
      onSearchSent(item, pos, instance, listeners, searchInfo, results);
    }, instance.id
  );

  // Perform the actual search
  global.SOCKET.post(`search/${instance.id}/hub_search`, {
    query
  });

};

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

const removeSearchAfterQueuing = async (search: string, pos: number) => {

  // get all search items from settings
  const settingsSearchItems = await global.SETTINGS.getValue('search_items');

  // turn items into array
  const items = settingsSearchItems[pos].pattern_list.split('\n');
  // remove matching item
  items.splice(items.indexOf(search));

  // turn items back to string
  const newPatternList = items.join('\n');

  // replace pattern list with new one
  settingsSearchItems[pos].pattern_list = newPatternList;

  // update settings
  await global.SETTINGS.setValue('search_items', settingsSearchItems);

};

// requeue all items that are older than the search interval
const requeueOldestSearches = async () => {

  const searchSchedule = global.SETTINGS.getValue('search_interval') * 60 * 1000;
  const timeAgo = Date.now() - searchSchedule;

  for (const item of global.SEARCH_HISTORY) {
    if (item.timestamp < new Date(timeAgo)) {
      // older than X minutes
      global.SEARCH_HISTORY.splice(global.SEARCH_HISTORY.indexOf(item));
    }
  }

};

const onSearchSent = async (item: any, pos: number, instance: any, listeners: any, searchInfo: any, results: any) => {

  // Show log message for the user
  printEvent(`The item "${searchInfo.query.pattern}" will be searched for on ${searchInfo.sent} hubs`, 'info');

  // Collect the results for some time
  let waited = 0;
  let dlStarted = false;
  while (results.length <= 5) {
    // sleep 2 seconds
    await utils.sleep(2000);
    waited = waited + 2;

    // queue download after 30 seconds, triggers only once, but doesn't exit loop
    if (waited <= 30 && results.length >= 1 && !dlStarted) {
      printEvent(`The item "${searchInfo.query.pattern}" was found with ${results.length} results, adding to queue now.`, 'info');
      startDownload(item, pos, instance, searchInfo, results);
      dlStarted = true;
    }
    // queue download when 2 or more results are found
    else if (waited > 30 && results.length >= 2) {
      startDownload(item, pos, instance, searchInfo, results);
      printEvent(`The item "${searchInfo.query.pattern}" was found with ${results.length} results, adding to queue now.`, 'info');
      break;
    }
    // wait maximum 5 minutes
    else if (waited >= 300) {
      break;
    }
  }

  // remove all listeners
  for (const listener of listeners) {
    listener();
  }
};


const startDownload = async ( item: any, pos: number, instance: any, searchInfo: any, results: any, ) => {
  const result = results[0];

  if (result) {
    try {
      global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
        priority: item.priority,
        target_directory: item.target_directory,
      });
      if (global.SETTINGS.getValue('search_items')[pos].remove_after_found) {
        removeSearchAfterQueuing(searchInfo.query.pattern, pos);
      }
    } catch (error) {
      printEvent(error, 'error');
    }

  }
};
