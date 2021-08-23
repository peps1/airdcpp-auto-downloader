import { initializeSearchInterval } from './search';

export const onExtensionSettingsUpdated = async (data: any, entityId: any) => {
  if (entityId.includes(EXTENSION_NAME) && 'search_interval' in data) {
    clearInterval(global.SEARCH_INTERVAL);
    initializeSearchInterval(data.search_interval);
  }
};

const searchQueryDefinitions = [
  {
    key: 'pattern_list',
    title: 'Search list',
    default_value: '',
    type: 'text',
    help: 'One search item/pattern per line',
    optional: true,
  }, {
    key: 'exclude',
    title: 'Exclude keywords',
    default_value: '',
    type: 'string',
    help: 'Separate keywords with ; ( example: word1;word2;word3 )',
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
    title: 'Remove from list after found and queued',
    default_value: false,
    type: 'boolean',
  }, {
    key: 'exact_match',
    title: 'Require an exact match',
    default_value: false,
    type: 'boolean',
  }, {
    key: 'queue_all',
    title: 'Queue all items matching the search',
    default_value: false,
    type: 'boolean',
    help: 'When enabling this, the search should be as explicit as possible, it may queue hundreds of downloads if used wrong.'
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
        pattern_list: '',
        extensions: '',
        priority: priorityAutoId,
        file_type: 'directory',
      }
    ],
    type: 'list',
    item_type: 'struct',
    definitions: [
      ...searchQueryDefinitions,
      {
        key: 'priority',
        title: 'Download priority',
        default_value: priorityAutoId,
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
