import { startDownload } from './download';
import { printEvent } from './log';
import { getNextPatternFromItem, requeueOldestSearches } from './queue';
import { GroupedSearchResult, SearchInstance } from './types/api/search';
import * as utils from './utils';

const onSearchResultAdded = (results: GroupedSearchResult[], result: any) => {
  results.push(result.result);
};

const onSearchResultUpdated = (results: GroupedSearchResult[], result: any) => {
  const toReplaceIndex = results.findIndex((element: any) => {
    return element.id === result.result.id;
  });
  results[toReplaceIndex] = result.result;
};

export const initializeSearchInterval = async (searchInterval: number) => {
  global.SEARCH_INTERVAL = setInterval(() => {
    searchItem();
  }, searchInterval * 60 * 1000);
};

const getItemWithHighestRevelance = (results: GroupedSearchResult[]) => {
  const max = Math.max(...results.map((o) => { return o.relevance; }));
  const result: any = results.find((o) => { return o.relevance === max; });
  return result;
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
    const instance: SearchInstance = await global.SOCKET.post('search', {
      expiration: 10
  });

  // Save the results
  const results: GroupedSearchResult[] = [];

  // build search payload
  const query = utils.buildSearchQuery(item, pattern[0]);

  // add result listener
  const removeResultAddedListener = await global.SOCKET.addListener(
    'search',
    'search_result_added',
    (searchResult: GroupedSearchResult) => {
      onSearchResultAdded(results, searchResult);
    }, instance.id
  );

  const removeResultUpdatedListener = await global.SOCKET.addListener(
    'search',
    'search_result_updated',
    (searchResult: GroupedSearchResult) => {
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

// trigger when search is sent to hub
const onSearchSent = async (item: string, pos: number, instance: SearchInstance, listeners: any, searchInfo: any, results: GroupedSearchResult[]) => {

  const exactMatch: boolean = global.SETTINGS.getValue('search_items')[pos].exact_match;
  const queueAll: boolean = global.SETTINGS.getValue('search_items')[pos].queue_all;
  const searchQueryPattern: string = searchInfo.query.pattern;

  let queueResults: GroupedSearchResult[];

  // Show log message for the user
  printEvent(`The item "${searchQueryPattern}" will be searched for on ${searchInfo.sent} hubs`, 'info');

  // Collect the results for some time
  let waited = 0;
  while (results.length <= 5) {
    // sleep 2 seconds
    await utils.sleep(2000);
    waited = waited + 2;

    // queue download after 30 seconds, triggers only once, but doesn't exit loop
    if (waited <= 30 && results.length >= 2) {

      if (!queueAll) {
        queueResults= [getItemWithHighestRevelance(results)];
      } else {
        queueResults = results;
      }

      queueResults.forEach((result) => {
        if ( (exactMatch && searchQueryPattern === result.name) || !exactMatch ) {
          if (queueAll) {
            printEvent(`Adding "${result.name}" to queue now.`, 'info');
          } else {
            printEvent(`The item "${searchQueryPattern}" was found with ${results.length} results, adding best match "${result.name}" (Relevance: ${result.relevance}) to queue now.`, 'info');
          }
          startDownload(item, pos, instance, searchInfo, result);
        }
      });

      break;
    }
    // queue download when 2 or more results are found
    else if (waited > 30 && results.length >= 1) {
      if (!queueAll) {
        queueResults = [getItemWithHighestRevelance(results)];
      } else {
        queueResults = results;
      }

      queueResults.forEach((result) => {
        if ( (exactMatch && searchQueryPattern === result.name) || !exactMatch ) {
          if (queueAll) {
            printEvent(`Adding "${result.name}" to queue now.`, 'info');
          } else {
            printEvent(`The item "${searchQueryPattern}" was found with ${results.length} results, adding best match "${result.name}" (Relevance: ${result.relevance}) to queue now.`, 'info');
          }
          startDownload(item, pos, instance, searchInfo, result);
        }
      });
      break;
    }
    // wait maximum 60 seconds
    else if (waited >= 60) {
      break;
    }
  }

  // remove all listeners
  for (const listener of listeners) {
    listener();
  }
};
