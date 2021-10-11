import { SearchItem } from './types';
import { GroupedSearchResult, SearchInstance } from './types/api/search';
import { printEvent } from './log';
import { removeSearchPatternFromList } from './queue';
import { toApiPriority } from './utils';
import { SeverityEnum } from 'types/api';

export const startDownload = async ( searchItem: SearchItem, listId: number, instance: SearchInstance, searchInfo: any, result: GroupedSearchResult, ) => {
  try {
    await global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: toApiPriority(searchItem.priority),
      target_directory: searchItem.target_directory,
    });
    if (global.SETTINGS.getValue('search_items')[listId].remove_after_found) {
      removeSearchPatternFromList(searchInfo.query.pattern, listId);
    }
  } catch (error: any) {
    printEvent(`${error.code} - ${error.message}`, SeverityEnum.ERROR);
  }
};
