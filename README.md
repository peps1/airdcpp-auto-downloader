# airdcpp-auto-downloader [![GitHub Actions][build-badge]][build] [![npm package][npm-badge]][npm] [![npm downloads][npm-dl-badge]][npm] [![codecov][coverage-badge]][coverage]

Extension to add search terms that will be searched in intervals and downloaded when found.

## Known issues
Changing the search interval requires stopping and starting the extension

## Features

* Configure search interval in minutes
* Provide multiple search terms as a list, one search term per line
* Options for:
  * minimum size
  * file type
  * file extensions
  * download directory
  * exclude keywords
  * priority
  * require exact match
  * allow queueing all items from search result
  * remove search term when found

## Screenshot

![Settings Screenshot](doc/settings-screenshot.png?raw=true "None")


## Resources

- [Bug tracker](https://github.com/peps1/airdcpp-auto-downloader/issues)
- [Changelog](https://github.com/peps1/airdcpp-auto-downloader/blob/master/CHANGELOG.md)

- [AirDC++ Web API reference](https://airdcpp.docs.apiary.io/)

[build-badge]: https://github.com/peps1/airdcpp-auto-downloader/workflows/build/badge.svg
[build]: https://github.com/peps1/airdcpp-auto-downloader/actions

[npm-badge]: https://img.shields.io/npm/v/airdcpp-auto-downloader.svg?style=flat-square
[npm]: https://www.npmjs.org/package/airdcpp-auto-downloader
[npm-dl-badge]: https://img.shields.io/npm/dt/airdcpp-auto-downloader?label=npm%20downloads&style=flat-square

[coverage-badge]: https://codecov.io/gh/peps1/airdcpp-auto-downloader/branch/master/graph/badge.svg
[coverage]: https://codecov.io/gh/peps1/airdcpp-auto-downloader
