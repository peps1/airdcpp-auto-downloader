'use strict';

const byteUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export const priorityEnum = [
	{
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

export const parseSearchQuery = (item: { pattern_list: any; extensions: string; file_type: any; min_size: number; }) => {
  return {
    pattern: item.pattern_list.split('\n'),
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
    help: 'Separate extensions with ; (example: exe;iso;img)',
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
        pattern_list: 'ubuntu-install\nfedora-install',
        extensions: 'iso;img',
        priority: 3,
        file_type: 'any',
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