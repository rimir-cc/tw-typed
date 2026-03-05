# typed

> Type system engine for TiddlyWiki -- schema definitions via tiddler fields

Define schemas via tiddler fields, validate instances, and create new typed tiddlers through a spawner UI.

## Key features

* **Type definitions** -- define schemas with `rrt.type` and `rrt.fields` on tiddler fields
* **Field definitions** -- validation rules, typed editors, calculated fields
* **Validator** -- UI to check all instances against their type schemas (see Validator tab)
* **Spawner** -- UI to create new typed tiddler instances (see Spawner tab)
* **Field editor** -- type-aware input controls for editing typed fields
* **Inheritance** -- parent types for shared field definitions
* **Custom filters** -- `rrfunc` filter functions for type system queries

## Prerequisites

No external prerequisites.

## Quick start

Define a type tiddler with `rrt.type` and field definitions. Use the Spawner tab to create instances. Use the Validator tab to check for schema violations across all typed tiddlers.

## Plugin Library

Install from the [rimir plugin library](https://rimir-cc.github.io/tw-plugin-library/) via *Control Panel → Plugins → Get more plugins*.

## Demo

Try this plugin in the [live demo wiki](https://rimir-cc.github.io/tw-demo/).

## License

MIT -- see [LICENSE.md](LICENSE.md)
