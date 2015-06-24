# WatchMyAssets
A NodeJs App that will watch your CakePHP App Assets configured for the [Asset Compress](https://github.com/markstory/asset_compress) CakePHP plugin.
It uses [fb-flo](https://facebook.github.io/fb-flo/) to watch your Assets files, and push the compressed built files to Chrome, so you can HotSwap the Javascript & CSS!

It uses _Gulp_ to run the built process, and thus is much faster than the PHP version. I created this set of tool because it's easier than modifying an existing Application to use new technologies.


## Installation

Fairly simple:
```bash
$> git clone https://github.com/ngotchac/WatchMyAssets.git
$> cd WatchMyAssets && npm install
```

You also need (to take full advantage of _WatchMyAssets_) the [fb-flo Chrome-Extension](https://chrome.google.com/webstore/detail/fb-flo/ahkfhobdidabddlalamkkiafpipdfchp?hl=en).

## Configuration

### Node

From this App side, you might wanna modify the `conf.json` file to match your current environment.
The only thing the Node app will ask it the fullpath to the `index.php` file of your CakePHP project.

It can be specified in the `conf.json` file, but could also be passed as an argument when running _WatchMyAssets_.

### PHP

You might want to modify the configuration of the _Asset Compress_ plugin so it won't rebuild your Asset(s) on
each Request in Development mode.

In `/path/to/app/Config/asset_compress.local.ini`, match these settings:
```ini
cacheConfig = false
alwaysEnableController = false
```

### Chrome-Extension

You will need to configure once the Chrome-Extension to match your current setup!

After installing the Extension, open-up the DevTools, switch to the `flo` tab, and 'Add New Site'. Enter the `hostname pattern`
(for example: `local.traackr.com`), the `flo server hostname` (here, `localhost` if run in the same environment as Chrome)
and optionnaly the `flo server port`, which is set in `src/flo-server.js` to the default 8888.

## Usage

Simply run (the `-p` option is optionnal, as it will look in the `conf.json` file, or prompt for the path):
```bash
$> node index.js [-p /path/to/app/index.php]
```

Then browse your App in Chrome with the DevTools open, go to the _flo_ tab, and make sure the Status is **Started**.

It will, firstly, build all your assets in `app/webroot/assets/[javascripts|stylesheets]`, and then will watch for all
the files in `app/Assets/`. Whenever a file is modified in this directory, it will rebuild all the Assets that depends
on this file (could be one, or many if it's a very common file, like the colors definition in SaSS).

Then, it will send the new file content up to the _fb-flo_ Chrome-Extension, for a very convenient HotSwap of JS & CSS.

Whenever an asset is modified, you should see a logs in the NodeJs App Terminal, and a Console Log in Chrome.

Check the _fb-flo_ repository for hooks in the Front-End javascript. For example, you could re-bootstrap your AngularJS
app whenever a file is modified! Example to come...

## Source-Maps & Chrome Workspace

_WatchMyAssets_ will generate Source-Maps, which is very convenient for debugging. However, to take full advantage of them, it requires a last extra-step from you.

First, add the `/path/to/app` directory to Chrome's Workspaces (right-click on the left-panel of the `Sources` tab, or via the DevTools options).
Then load your app, and try to click on a log source file if any, or a CSS/SaSS source file while inspecting an element. It should open an empty file,
from which you can right-click to `Map to File System Resource...`. You'll have the choice between from one to many files, so choose the right one.

You can check that the config is correct by going in the DevTools options > Workspace > Folder > Folder options...

Now, if you modify a CSS in the Chrome DevTools Sources tab, it will be save on disk, built from the NodeJs process, and sent back to Chrome via fb-flo!


Enjoy!!

