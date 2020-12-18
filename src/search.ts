import { printEvent } from './log';
import * as utils from './utils';

export const searchItem = async (fileExtension: any) => {
  // Anything to search for?
  const itemCount = global.SETTINGS.getValue('search_items').length;
  if (itemCount === 0) {
    return;
  }

  // Get a random item to search for
  // TODO: pick random item, check item against recently searched list, if on list pick another, add item to list of recently searched (save in settings.json)
  // TODO: when all items already on recently searched list, delete oldest items from list (oldest N)
  // TODO: How can sort through the json? https://stackoverflow.com/questions/3859239/sort-json-by-date ?
  // TODO: iterate through whole item list per search_interval
  const pos = Math.floor(Math.random() * itemCount);

  const item = global.SETTINGS.getValue('search_items')[pos];

  // The item might actually be a list of items

  // Create instance
  const instance: any = await global.SOCKET.post('search');

  // Add instance-specific listener for results
  const unsubscribe = await global.SOCKET.addListener('search', 'search_hub_searches_sent', (searchInfo: any) => {
    onSearchSent(item, instance, unsubscribe, searchInfo);
  }, instance.id);

  const pattern = getNextPatternFromItem(item, pos);

  // TODO: REMOVE
  // eslint-disable-next-line no-console
  console.log(global.SEARCH_HISTORY);

  if (!pattern) {
    // TODO: implement proper way to clear search history
    printEvent('All items have been already searched, no more searches to do.', 'info');
    return;
  }

  const query = utils.parseSearchQuery(item, pattern[0]);

  // Perform the actual search
  const searchQueueInfo: any = await global.SOCKET.post(`search/${instance.id}/hub_search`, {
    query
  });

  // Show log message for the user
  printEvent(`The item ${pattern[1]} was searched for from ${searchQueueInfo.queued_count} hubs`, 'info');

};

export const getNextPatternFromItem = (queryItem: any, pos: number): [number, string]|undefined => {
  for (const [index, singlePattern] of queryItem.pattern_list.split('\n').entries()) {

    if (global.SEARCH_HISTORY[pos]) {
      if (global.SEARCH_HISTORY[pos].includes(singlePattern)) {
        // skip item if already in list
        continue;
      } else {
        global.SEARCH_HISTORY[pos].push(singlePattern);
        return [index, singlePattern];
      }
    } else {
      global.SEARCH_HISTORY[pos] = [];
      global.SEARCH_HISTORY[pos].push(singlePattern);
      return [index, singlePattern];
    }
  }
  return;
};

const onSearchSent = async (item: any, instance: any, unsubscribe: any, searchInfo: any) => {
  // Collect the results for 5 seconds
  await utils.sleep(5000);

  // Get only the first result (results are sorted by relevance)
  // TODO: we might want to have more results
  const results: any = await global.SOCKET.get(`search/${instance.id}/results/0/1`);

  // TODO: try for a bit longer if no results yet
  if (results.length > 0) {
    // We have results, download the best one
    // TODO: we might want to download multiple
    // TODO: multiple results might only make sense for directory downloads? Or TV seasons? Maybe config setting "allow multiple results"
    const result = results[0];
    global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: item.priority,
      target_directory: item.target_directory,
    });
  }

  // Remove listener for this search instance
  unsubscribe();
};
