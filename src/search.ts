import { startDownload } from './download';
import { printEvent } from './log';
import { getNextPatternFromItem, removeSearchItemFromList, requeueOldestSearches } from './queue';
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

const getItemWithHighestRelevance = (results: GroupedSearchResult[]) => {
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
  const listId = Math.floor(Math.random() * itemCount);

  const itemList = global.SETTINGS.getValue('search_items')[listId];

  // The item might actually be a list of items

  // Get next item to search
  let pattern = getNextPatternFromItem(itemList, listId);

  if (!pattern) {
    requeueOldestSearches();
    // Get next item to search
    pattern = getNextPatternFromItem(itemList, listId);
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
  const query = utils.buildSearchQuery(itemList, pattern[0]);

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
      onSearchSent(itemList, listId, instance, listeners, searchInfo, results);
    }, instance.id
  );

  // Perform the actual search
  global.SOCKET.post(`search/${instance.id}/hub_search`, {
    query
  });

};

// trigger when search is sent to hub
const onSearchSent = async (item: string, listId: number, instance: SearchInstance, listeners: any, searchInfo: any, results: GroupedSearchResult[]) => {

  const exactMatch: boolean = global.SETTINGS.getValue('search_items')[listId].exact_match;
  const queueAll: boolean = global.SETTINGS.getValue('search_items')[listId].queue_all;
  const queueDupe: string = global.SETTINGS.getValue('search_items')[listId].queue_dupe;
  const removeDupe: boolean = global.SETTINGS.getValue('search_items')[listId].remove_dupe;
  const excludedUsers = utils.getExcludedUsers(global.SETTINGS.getValue('search_items')[listId].excluded_users);
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

    // queue download when 2 or more results are found
    // queue download after 30s
    if ( (waited <= 30 && results.length >= 2) || (waited > 30 && results.length >= 1)) {

      // get only the most relevant item if queueAll is disabled
      if (!queueAll) {
        queueResults= [getItemWithHighestRelevance(results)];
      } else {
        queueResults = results;
      }

      // remove dupe from list
      // If there is multiple results we plan to download,
      // we only remove the search term if all of these are dupes.
      // Dupes within the search term will still be skipped below
      if ( removeDupe && queueResults.every((result) => {
        utils.isDupe(result.dupe);
      }) ) {
        removeSearchItemFromList(searchQueryPattern, listId);
      }

      // inside use return to skip search result
      queueResults.forEach((result) => {

        // check exact match
        if ( exactMatch && searchQueryPattern !== result.name ) { return; }

        // check exclude users
        const nicks = utils.turnNicksIntoArray(result.users.user.nicks);
        if (result.users.count === 1 && excludedUsers.some( (excludeUser) => {
          return nicks.some( (nick) => {
            return nick.includes(excludeUser);
          });
        })) { return; }

        // check for dupe
        switch (queueDupe) {
          case 'no_dupes':
            if ( utils.isDupe(result.dupe) ) { return; }
            break;
          case 'share':
            if ( utils.isQueueDupe(result.dupe) ) { return; }
            break;
          case 'queue':
            if ( utils.isShareDupe(result.dupe) ) { return; }
            break;
          case 'share_queue':
            break;
        }

        if (queueAll) {
          printEvent(`Adding "${result.name}" to queue now.`, 'info');
        } else {
          printEvent(`The item "${searchQueryPattern}" was found with ${results.length} results, adding best match "${result.name}" (Relevance: ${result.relevance}) to queue now.`, 'info');
        }
        startDownload(item, listId, instance, searchInfo, result);
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
