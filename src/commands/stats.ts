import { printStatusMessage } from '../log';
import { formatTimeSeconds, searchHistoryStats } from '../utils';

export const autoDlStats = async (type: string, entityId: string|number) => {
  const stats = await searchHistoryStats(global.DbPath);
  const oldest = stats.oldestSearch;
  const newest = stats.newestSearch;
  const output = `
  -=[ airdcpp-auto-downloader https://github.com/peps1/airdcpp-auto-downloader ]=-
  -=[ Searches tracked: ${stats.totalSearches} ]=-
  -=[ Oldest Search: ${new Date(oldest).toLocaleString()} ]=-
  -=[ Most recent Search: ${new Date(newest).toLocaleString()} ]=-
  -=[ Time since last search: ${formatTimeSeconds(stats.timeSince)} ]=-
  -=[ Time between oldest / newest: ${formatTimeSeconds(stats.timeDifference)} ]=-
    `;
  printStatusMessage(output, type, entityId);
};