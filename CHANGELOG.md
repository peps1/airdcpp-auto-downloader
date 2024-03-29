# Changelog

## [v1.0.0-beta13](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.13) (2023-01-09)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.12...v1.0.0-beta.13)

### Changed
* replaced globalThis with global.
* updated dependencies
* updated README to add supported NodeJS version information

## [v1.0.0-beta12](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.12) (2021-10-11)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.11...v1.0.0-beta.12)

### Fixed
* fixed missing await statement, that might have caused the db file to corrupt
* return proper error message when the db can't be loaded on start

### Changed
* added some more and better logging

## [v1.0.0-beta11](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.11) (2021-10-07)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.10...v1.0.0-beta.11)

### Fixed
* keep searching same item over and over
* remove orphaned items from db

## [v1.0.0-beta10](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.10) (2021-10-03)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.9...v1.0.0-beta.10)

### Fixed
* When all items from all lists are searched, it would keep repeating the last item searched.

## [v1.0.0-beta9](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.9) (2021-10-02)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.8...v1.0.0-beta.9)

### Fixed
* small bug when dealing with multiple lists
* small bug when saving db file

### Known Issues
* When all items from all lists are searched, it will keep repeating the last item searched. Will be fixed in next version

## [v1.0.0-beta8](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.8) (2021-10-02)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.7...v1.0.0-beta.8)

### Fixed
* When using multiple lists it would keep repeat searching items from first list more often than others.
* Exclude keywords: used wrong option, also updated config parameter and migrating old config. (Thanks for reporting!) [#13](https://github.com/peps1/airdcpp-auto-downloader/issues/13)

### Added
* Saving already searched items through restarts
* Search interval will now be set immediatly after config change, extension restart was required before.
* Option to exclude users (please check README for some notes) [#7](https://github.com/peps1/airdcpp-auto-downloader/issues/7)
* Option to prevent or allow downloading dupes (Share dupes or Queue dupes) [#7](https://github.com/peps1/airdcpp-auto-downloader/issues/7)
* Option to remove Queue/Share dupe items from search [#7](https://github.com/peps1/airdcpp-auto-downloader/issues/7)

### Internals
* some cleanup
* adding some typings
* don't pack .ts files
* Update dependencies

## [v1.0.0-beta7](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.7) (2021-08-15)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.6...v1.0.0-beta.7)

### Fixed
* Priority IDs [#13](https://github.com/peps1/airdcpp-auto-downloader/issues/13)

## [v1.0.0-beta6](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.6) (2021-08-15)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.4...v1.0.0-beta.6)

### Added
* Option to exclude keywords
* Option to require exact match
* Option to allow queueing all items from search result

## [v1.0.0-beta4](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.4) (2021-08-08)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.3...v1.0.0-beta.4)

### Changed
* Ensure to only download the best match
* Update dependencies

## [v1.0.0-beta3](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.3) (2021-01-10)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/v1.0.0-beta.2...v1.0.0-beta.3)

### Added
* auto priority

### Changed
* Default priority set to auto

## [v1.0.0-beta2](https://github.com/peps1/airdcpp-auto-downloader/tree/v1.0.0-beta.2) (2021-01-07)
[Full git log](https://github.com/peps1/airdcpp-auto-downloader/compare/0068f7bb65a1ae626083c61c778f73493ffa3bce...v1.0.0-beta.2)

Initial release
