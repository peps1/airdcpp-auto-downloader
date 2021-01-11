'use strict';

const byteUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

const priorityAutoId = 100;

export const priorityEnum = [
	{
		id: priorityAutoId,
		name: 'Auto',
	}, {
		id: -1,
		name: 'Paused (forced)',
	}, {
		id: 0,
		name: 'Paused',
	}, {
		id: 1,
		name: 'Lowest',
	}, {
		id: 2,
		name: 'Low',
	}, {
		id: 3,
		name: 'Normal',
	}, {
		id: 4,
		name: 'High',
	}, {
		id: 5,
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

export const buildSearchQuery = (item: { pattern_list: any; extensions: string; file_type: any; min_size: number; }, itemIndex = 0) => {
  return {
    pattern: item.pattern_list.split('\n')[itemIndex],
    extensions: item.extensions.split(';'),
    file_type: item.file_type,
    min_size: item.min_size * 1024 * 1024, // MiB
  };
};

export const searchQueryDefinitions = [
  {
    key: 'pattern_list',
    title: 'Search list',
    default_value: '',
    type: 'text',
    help: 'One search item/pattern per line',
    optional: true,
  }, {
    key: 'extensions',
    title: 'File extensions',
    default_value: '',
    type: 'string',
    help: 'Separate extensions with ; ( example: exe;iso;img )',
    optional: true,
  }, {
    key: 'file_type',
    title: 'File type',
    default_value: 'any',
    type: 'string',
    options: fileTypeEnum,
  }, {
    key: 'min_size',
    title: 'Minimum size (MiB)',
    default_value: 0,
    type: 'number',
  }, {
    key: 'remove_after_found',
    title: 'Remove after found',
    default_value: false,
    type: 'boolean',
  }
];

// Default settings
export const SettingDefinitions = [
  {
    key: 'search_interval',
    title: 'Search interval (minutes)',
    default_value: 5,
    type: 'number',
  }, {
    key: 'search_items',
    title: 'Search items',
    optional: true,
    default_value: [
      {
        pattern_list: 'ubuntu server amd64\nfedora-install',
        extensions: 'iso;img',
        priority: 0,
        file_type: 'file',
      },
      {
        pattern_list: 'manjaro-architect\ngrml64-small',
        extensions: 'iso;img',
        priority: 0,
        file_type: 'file',
      }
    ],
    type: 'list',
    item_type: 'struct',
    definitions: [
      ...searchQueryDefinitions,
      {
        key: 'priority',
        title: 'Priority',
        default_value: 3,
        type: 'number',
        options: priorityEnum,
      }, {
        key: 'target_directory',
        title: 'Target directory',
        default_value: '',
        type: 'directory_path',
        help: 'Leave empty to use the default download directory',
        optional: true,
      },
    ]
  }
];
