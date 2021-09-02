import { printEvent } from './log';
import { removeSearchItemFromList } from './queue';
import { toApiPriority } from './utils';

export const startDownload = async ( item: any, listId: number, instance: any, searchInfo: any, result: any, ) => {
  try {
    await global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: toApiPriority(item.priority),
      target_directory: item.target_directory,
    });
    if (global.SETTINGS.getValue('search_items')[listId].remove_after_found) {
      removeSearchItemFromList(searchInfo.query.pattern, listId);
    }
  } catch (error: any) {
    printEvent(`ERROR: ${error.code} - ${error.message}`, 'error');
  }
};
