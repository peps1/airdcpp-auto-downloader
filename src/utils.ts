'use strict';
import { getDb } from './localdb';
import { SearchHistory, SearchItem } from './types';
import * as API from './types/api';
import { DupeEnum } from './types/api';

const byteUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export const priorityAutoId = 100;

export const priorityEnum = [
  {
    id: priorityAutoId,
    name: 'Auto',
  }, {
    id: 0,
    name: 'Paused (forced)',
  }, {
    id: 1,
    name: 'Paused',
  }, {
    id: 2,
    name: 'Lowest',
  }, {
    id: 3,
    name: 'Low',
  }, {
    id: 4,
    name: 'Normal',
  }, {
    id: 5,
    name: 'High',
  }, {
    id: 6,
    name: 'Highest',
  }
];

export const fileTypeEnum = [
  {
    id: 'any',
    name: 'Any',
  }, {
    id: 'directory',
    name: 'Directory',
  }, {
    id: 'file',
    name: 'File',
  }, {
    id: 'audio',
    name: 'Audio',
  }, {
    id: 'compressed',
    name: 'Compressed',
  }, {
    id: 'document',
    name: 'Document',
  }, {
    id: 'executable',
    name: 'Executable',
  }, {
    id: 'picture',
    name: 'Picture',
  }, {
    id: 'video',
    name: 'Video',
  }
];

export const dupeStringsEnum = [
  {  id: 'share', name: 'In Share Only' },
  {  id: 'queue', name: 'In Queue Only' },
  {  id: 'share_queue', name: 'In Share or Queue' },
  {  id: 'no_dupes', name: 'No Dupes' },
];

export const isDupe = (dupe: API.Dupe | null) => !!dupe && (
  dupe.id === DupeEnum.SHARE_FULL        ||
  dupe.id === DupeEnum.SHARE_PARTIAL     ||
  dupe.id === DupeEnum.QUEUE_FULL        ||
  dupe.id === DupeEnum.QUEUE_PARTIAL     ||
  dupe.id === DupeEnum.SHARE_QUEUE       ||
  dupe.id === DupeEnum.FINISHED_FULL     ||
  dupe.id === DupeEnum.FINISHED_PARTIAL
);

export const isShareDupe = (dupe: API.Dupe | null) => !!dupe && (
  dupe.id === DupeEnum.SHARE_FULL ||
  dupe.id === DupeEnum.SHARE_PARTIAL
);

export const isQueueDupe = (dupe: API.Dupe | null) => !!dupe && (
  dupe.id === DupeEnum.QUEUE_FULL ||
  dupe.id === DupeEnum.QUEUE_PARTIAL
);

// Format bytes to MiB, GiB, TiB
export const formatSize = (fileSizeInBytes: number): string => {
  const thresh = 1024;
  if (Math.abs(fileSizeInBytes) < thresh) {
    return fileSizeInBytes + ' B';
  }

  let u = -1;
  do {
    fileSizeInBytes /= thresh;
    ++u;
  } while (Math.abs(fileSizeInBytes) >= thresh && u < byteUnits.length - 1);

  const result = fileSizeInBytes.toFixed(2) + ' ' + byteUnits[u];
  return result;
};

// Format nicely (151 days 18 hours 58 minutes 25 seconds)
export const formatTimeSeconds = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor(((seconds % 86400) % 3600) / 60);
  const s = Math.floor(((seconds % 86400) % 3600) % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? ' day ' : ' days ') : '';
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour ' : ' hours ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute ' : ' minutes ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

// Works only for directories
export const getLastDirectory = (fullPath: string) => {
  const result = fullPath.match(/([^/]+)[/]?$/);
  return result ? result[1] : fullPath;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const toApiPriority = (id: number) => {
  return id === priorityAutoId ? null : id;
};

// return empty array instead of single empty string in array
export const getExcludedUsers = (excludedUsers: string): string[] => {
  return !excludedUsers ? [] : excludedUsers.trim().split(';');
};

export const turnNicksIntoArray = (nicks: string): string[] => {
  const regex = /[,]|^(\(|\))/g;

  // turn usernames string into array
  let nicksArray = nicks.split(' ');

  // 1. replace unneeded characters
  // 2. trim whitespaces
  // 3. filter empty strings
  nicksArray = nicksArray.map(x => x.replace(regex, '').trim()).filter(item => { return item !== ''; });
  return nicksArray;
};

export const buildSearchQuery = (item: SearchItem, singlePattern: string) => {
  return {
    pattern: singlePattern,
    extensions: item.extensions.split(';'),
    excluded: item.excluded.split(';'),
    file_type: item.file_type,
    min_size: item.min_size * 1024 * 1024, // MiB
  };
};

export const searchHistoryStats = async (dbFilePath: string) => {
  const db = await getDb(dbFilePath);

  const totalSearches = db.get('search_history').value().length;
  const timestamps: string[] = db.get('search_history').value().map((search: SearchHistory) => search.timestamp).sort();

  let timeDifference: number;
  let timeSince: number;
  let oldestSearch: Date|string;
  let newestSearch: Date|string;

  if (timestamps.length >= 2) {
    oldestSearch = timestamps[0];
    newestSearch = timestamps[timestamps.length - 1];
    timeDifference = Math.round((new Date(newestSearch).getTime() - new Date(oldestSearch).getTime()) / 1000) || 0;
    timeSince = Math.round((Date.now() - new Date(newestSearch).getTime()) / 1000) || 0;
  } else {
    oldestSearch = 'no searches ran yet';
    newestSearch = 'no searches ran yet';
    timeDifference = 0;
    timeSince = 0;
  }

  return {
    totalSearches,
    oldestSearch,
    newestSearch,
    timeDifference,
    timeSince
  };
};

// if object with same pattern exists already, return the index in array
export const getIndexForPattern = (array: SearchHistory[], object: SearchHistory) => {
  const index = array.findIndex((element) => element.pattern === object.pattern);
  return index;
};

// remove all duplicate patterns from array and return new array
export const deDupeSearchHistory = (array: SearchHistory[]) => {
  const patterns = array.map(o => o.pattern);
  const filtered = array.filter(({pattern}, index) => !patterns.includes(pattern, index + 1));
  return filtered;
};
