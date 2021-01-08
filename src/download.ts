import { printEvent } from './log';
import { removeSearchAfterQueuing } from './queue';

export const startDownload = async ( item: any, pos: number, instance: any, searchInfo: any, results: any, ) => {
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
