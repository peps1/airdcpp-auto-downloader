/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as utils from './utils';
import { GroupedSearchResult, SearchInstance } from './types/api/search';
import { SearchItem, SearchPatternItem } from './types';
import { getDb } from './localdb';
import { getSearchPattern, removeSearchPatternFromList } from './queue';
import { printEvent } from './log';
import { startDownload } from './download';

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
    runSearch();
  }, searchInterval * 60 * 1000);
};

const getItemWithHighestRelevance = (results: GroupedSearchResult[]) => {
  const max = Math.max(...results.map((o) => { return o.relevance; }));
  const result: any = results.find((o) => { return o.relevance === max; });
  return result;
};

export const runSearch = async () => {

  // Anything to search for?
  const searchLists = global.SETTINGS.getValue('search_items').length;
  if (searchLists === 0) {
    return;
  }

  // Get next item to search
  const pattern = await getSearchPattern();

  // don't search for empty strings
  if (!pattern) {
    return;
  }
  const searchItem: SearchItem = global.SETTINGS.getValue('search_items')[pattern.searchItemId];

  // Create search instance, expires after 10 minutes
  const instance: SearchInstance = await global.SOCKET.post('search', {
    expiration: 10
  });

  // Save the results
  const results: GroupedSearchResult[] = [];

  // build search payload
  const query = utils.buildSearchQuery(searchItem, pattern.patternIndex);

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
      onSearchSent(searchItem, pattern, instance, listeners, searchInfo, results);
    }, instance.id
  );

  // Perform the actual search
  global.SOCKET.post(`search/${instance.id}/hub_search`, {
    query
  });

};

// trigger when search is sent to hub
const onSearchSent = async (searchItem: SearchItem, pattern: SearchPatternItem, instance: SearchInstance, listeners: any, searchInfo: any, results: GroupedSearchResult[]) => {

  const wantExactMatch: boolean = global.SETTINGS.getValue('search_items')[pattern.searchItemId].exact_match;
  const wantQueueAll: boolean = global.SETTINGS.getValue('search_items')[pattern.searchItemId].queue_all;
  const queueDupe: string = global.SETTINGS.getValue('search_items')[pattern.searchItemId].queue_dupe;
  const wantRemoveDupe: boolean = global.SETTINGS.getValue('search_items')[pattern.searchItemId].remove_dupe;
  const excludedUsers = utils.getExcludedUsers(global.SETTINGS.getValue('search_items')[pattern.searchItemId].excluded_users);
  const searchQueryPattern: string = searchInfo.query.pattern;

  let queueResults: GroupedSearchResult[];

  const db = await getDb(global.DbPath);

  // Show log message for the user
  printEvent(`The item "${searchQueryPattern}" will be searched for on ${searchInfo.sent} hubs`, 'info');

  db.get('search_history').value().push({
    pattern: searchQueryPattern,
    patternIndex: pattern.patternIndex,
    timestamp: new Date(),
    searchItemId: pattern.searchItemId
  });
  db.save();

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
      if (!wantQueueAll) {
        queueResults= [getItemWithHighestRelevance(results)];
      } else {
        queueResults = results;
      }

      // remove dupe from list
      // If there is multiple results we plan to download,
      // we only remove the search term if all of these are dupes.
      // Dupes within the search term will still be skipped below
      if ( wantRemoveDupe && queueResults.every((result) => {
        utils.isDupe(result.dupe);
      }) ) {
        removeSearchPatternFromList(searchQueryPattern, pattern.searchItemId);
      }

      // inside use return to skip search result
      queueResults.forEach((result) => {

        // check exact match
        if ( wantExactMatch && searchQueryPattern !== result.name ) { return; }

        // check exclude users
        const nicks = utils.turnNicksIntoArray(result.users.user.nicks);
        if (excludedUsers.length !== 0 && result.users.count === 1 && excludedUsers.some( (excludeUser) => {
          return nicks.some( (nick) => {
            return nick.includes(excludeUser);
          });
        })) {
          return; }

        // check for dupe
        switch (queueDupe) {
          case 'no_dupes':
            if ( utils.isDupe(result.dupe) ) {
              return; }
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

        if (wantQueueAll) {
          printEvent(`Adding "${result.name}" to queue now.`, 'info');
        } else {
          printEvent(`The item "${searchQueryPattern}" was found with ${results.length} results, adding best match "${result.name}" (Relevance: ${result.relevance}) to queue now.`, 'info');
        }
        startDownload(searchItem, pattern.searchItemId, instance, searchInfo, result);
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
