import { printEvent } from './log';
import * as utils from './utils';

// Save the results
const results: any = [];

const onSearchResultAdded = (result: any) => {
  results.push(result.result);
};

const onSearchResultUpdated = (result: any) => {
  const toReplaceIndex = results.findIndex((element: any) => {
    return element.id === result.result.id;
  });
  results[toReplaceIndex] = result.result;
};

export const searchItem = async (fileExtension: any) => {
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

  // Get instance
  const instance: any = global.SEARCH_INSTANCE;

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

  // add result listener
  const removeResultAddedListener = await global.SOCKET.addListener(
    'search',
    'search_result_added',
    onSearchResultAdded,
    instance.id
  );
  const removeResultUpdatedListener = await global.SOCKET.addListener(
    'search',
    'search_result_updated',
    onSearchResultUpdated,
    instance.id
  );

  // build search payload
  const query = utils.buildSearchQuery(item, pattern[0]);

  // Perform the actual search
  const searchQueueInfo: any = await global.SOCKET.post(`search/${instance.id}/hub_search`, {
    query
  });

  // Show log message for the user
  printEvent(`The item ${pattern[1]} was searched for from ${searchQueueInfo.queued_count} hubs`, 'info');


  // Collect the results for some time
  let waited = 0;
  while (results.length <= 1) {
    // sleep 2 seconds
    await utils.sleep(2000);
    waited = waited + 2;

    if (waited >= 20) {
      break;
    }
  }

  const result = results[0];

  if (result) {
    global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: item.priority,
      target_directory: item.target_directory,
    });
  }

  // Remove the Listeners
  await removeResultAddedListener();
  await removeResultUpdatedListener();

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
      global.SEARCH_HISTORY.push({
        name: singlePattern,
        timestamp: new Date()
      });
      return [index, singlePattern];
    }
  }
  return;
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
