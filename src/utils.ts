'use strict';

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

export const getExcludedUsers = (excludedUsers: string): string[] => {
	return excludedUsers.split(';');
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

export const buildSearchQuery = (item: { pattern_list: any; extensions: string; excluded: string; file_type: any; min_size: number; }, itemIndex = 0) => {
  return {
    pattern: item.pattern_list.split('\n')[itemIndex],
    extensions: item.extensions.split(';'),
		excluded: item.excluded.split(';'),
    file_type: item.file_type,
    min_size: item.min_size * 1024 * 1024, // MiB
  };
};
