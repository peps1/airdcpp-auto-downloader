import { printEvent } from './log';
import { removeSearchItemFromList } from './queue';
import { toApiPriority } from './utils';

export const startDownload = async ( item: any, pos: number, instance: any, searchInfo: any, result: any, ) => {
  try {
    await global.SOCKET.post(`search/${instance.id}/results/${result.id}/download`, {
      priority: toApiPriority(item.priority),
      target_directory: item.target_directory,
    });
    if (global.SETTINGS.getValue('search_items')[pos].remove_after_found) {
      removeSearchItemFromList(searchInfo.query.pattern, pos);
    }
  } catch (error: any) {
    printEvent(`ERROR: ${error.code} - ${error.message}`, 'error');
  }
};
