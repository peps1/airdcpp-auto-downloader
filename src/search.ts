import * as utils from './utils';
import type { APISocket } from 'airdcpp-apisocket';

const searchItem = async (socket: APISocket, extension: any, settings: any) => {
  // Anything to search for?
  const itemCount = settings.getValue('search_items').length;
  if (itemCount === 0) {
    return;
  }

  // Get a random item to search for
  // TODO: pick random item, check item against recently searched list, if on list pick another, add item to list of recently searched (save in settings.json)
  // TODO: when all items already on recently searched list, delete oldest items from list (oldest N)
  // TODO: How can sort through they json? https://stackoverflow.com/questions/3859239/sort-json-by-date ?
  const pos = Math.floor(Math.random() * itemCount);
  const item = settings.getValue('search_items')[pos];

  // The item might actually be a list of items

  // Create instance
  const instance: any = await socket.post('search');

  // Add instance-specific listener for results
  const unsubscribe = await socket.addListener('search', 'search_hub_searches_sent', searchInfo => {
    onSearchSent(socket, item, instance, unsubscribe, searchInfo);
  }, instance.id);

  // Perform the actual search
  const searchQueueInfo: any = await socket.post(`search/${instance.id}/hub_search`, {
    query: utils.parseSearchQuery(item),
  });

  // Show log message for the user
  socket.post('events', {
    text: `Auto downloader: the item ${item.pattern_list} was searched for from ${searchQueueInfo.queued_count} hubs`,
    severity: 'info',
  });
};

const onSearchSent = async (socket: APISocket, item: any, instance: any, unsubscribe: any, searchInfo: any) => {
  // Collect the results for 5 seconds
  await utils.sleep(5000);

  // Get only the first result (results are sorted by relevance)
  // TODO: we might want to have more results
  const results: any = await socket.get(`search/${instance.id}/results/0/1`);

  // TODO: try for a bit longer if no results yet
  if (results.length > 0) {
    // We have results, download the best one
    // TODO: we might want to download multiple
    // TODO: multiple results might only make sense for directory downloads? Or TV seasons? Maybe config setting "allow multiple results"
    const result = results[0];
    socket.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: item.priority,
      target_directory: item.target_directory,
    });
  }

  // Remove listener for this search instance
  unsubscribe();
};

export default searchItem;
