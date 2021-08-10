import { priorityAutoId, priorityEnum, fileTypeEnum } from './utils';

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
    help: 'Separate extensions with ; ( example: word1;word2;word3 )',
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
        title: 'Priority',
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
