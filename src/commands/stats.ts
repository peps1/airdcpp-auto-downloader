import { printStatusMessage } from '../log';
import { formatTimeSeconds, searchHistoryStats } from '../utils';

export const autoDlStats = async (type: string, entityId: string|number) => {
  const stats = await searchHistoryStats(global.DbPath);
  const oldest = stats.oldestSearch;
  const newest = stats.newestSearch;
  const output = `
  -=[ airdcpp-auto-downloader https://github.com/peps1/airdcpp-auto-downloader ]=-
  -=[ Total Searches: ${stats.totalSearches} ]=-
  -=[ Oldest Search: ${oldest.toString()} ]=-
  -=[ Most recent Search: ${newest.toString()} ]=-
  -=[ Time Since: ${formatTimeSeconds(stats.timeSince)} ]=-
  -=[ Time Diff: ${formatTimeSeconds(stats.timeDifference)} ]=-
    `;
  printStatusMessage(output, type, entityId);
};