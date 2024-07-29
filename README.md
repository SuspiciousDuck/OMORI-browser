# OMORI-browser
This guide will only have instructions for a Linux host, if you're on Windows, you can use WSL.
# Table of contents:
1. [Steps](#steps)
2. [Bonus Steps](#bonus-steps)
3. [Porting save files](#porting-existing-save-files)
4. [Editing save data](#editing-save-data)
## Requirements
* A copy of OMORI v1.0.8
* sed - for utility script that fixes file names
* node - for utility script that fixes file names
## Steps
1. Decrypt OMORI's files using an external tool (ie: [OMORI-Decryptor](https://github.com/SuspiciousDuck/OMORI-Decryptor))
 - note: the tool above outputs only decrypted files
 - you should copy OMORI's game files to another folder and use it as both the input and output folder
2. Traverse to the OMORI root directory (the folder with OMORI.exe)
3. Delete the following files
```bash
rm www/js/libs/greenworks* \
    www/js/libs/lib* \
    www/js/libs/steam* \
    www/js/libs/sdk* \
    www/js/libs/SteamConfig.ini \
    www/js/plugins/Archeia_Steamworks.js
```
4. Apply OMORI.patch
```bash
# assuming OMORI.patch is in the current directory
# make sure you're in the OMORI root folder
patch -p1 --dry-run < OMORI.patch
```
5. Run first utility script to fix some errors
```bash
# assuming replace.sh is in the current directory
# replace ~/OMORI with the path to your (decrypted) OMORI root folder
# make sure that there's no leading slash(/)
bash ./replace.sh ~/OMORI
```
6. Run second utility script to fix some errors
```bash
# assuming replace.js is in the current directory
# IMPORTANT: you MUST run it in the OMORI root directory
node ./replace.js
```
## Bonus Steps
### Minify files to decrease network load
### Requirements:
* jq - to compress JSON files
* yq - to compress YAML files
* uglifyjs - to compress JS files
1. Run third utility script to compress game data.
```bash
# assuming compress.sh is in the same directory
# replace ~/OMORI with the path to your (decrypted) OMORI root folder
# note: this can't be undone and mangles the files to be smaller
# you should probably make a copy before running this
bash ./compress.sh ~/OMORI
```
### Save on storage space by deleting encrypted files (if present)
```bash
# assuming you're in the OMORI root directory
find ./www/ \( -name "*.rpgmvp" -o -name "*.rpgmvo" -o -name "*.KEL" -o -name "*.AUBREY" -o -name "*.HERO" -o -name "*.PLUTO" \) -exec rm {} \;
```
## Playing OMORI in your web browser
Now that you've done all the steps and optionally the bonus steps, you now should have a web-browser compatible copy of OMORI. But you're not done yet. First, you need a web server.
### Method 1: local web server
```bash
# replace ~/OMORI with OMORI's root folder. make sure to append /www
# OMORI should be hosted on 127.0.0.1:9999
npx http-server ~/OMORI/www -o -p 9999
```
### Method 2: reverse proxy
For this example, I'll be using CaddyV2. Make sure to have Caddy installed. <br>
./Caddyfile
```
example.com {
  file_server {
    root /path/to/OMORI/www
  }
}
```
```bash
caddy run
```
## Porting save data
You can find your save data in `OMORI root folder/www/save`
```
# example files
$ ls ~/OMORI/www/save
config.rpgsave file1.rpgsave global.rpgsave TITLEDATA
```
The patched OMORI uses localStorage in order to save your data. In order to set your save data manually, you must run `window.localStorage.setItem("key", "value");` in your browser's console.<br>
This is a table which shows what you'd set as "key"
|filename|key|
|-|-|
|TITLEDATA|TITLEDATA|
|global.rpgsave|RPG Global|
|config.rpgsave|RPG Config|
|fileX.rpgsave|RPG FileX|

This is an example for manually setting savedata
```javascript
window.localStorage.setItem("TITLEDATA", "445");
```
### Editing save data
All of the files which end with `.rpgsave` are all Base64 encoded. However, it appears its not standard, so you can't use any generic decoder.
1. Enter OMORI in your web browser
2. In your browser's console, run `JSON.parse(LZString.decompressFromBase64(data))`, but replace `data` with the contents of your file in quotes(")<br>
Example output:
```
JSON.parse(LZString.decompressFromBase64("NoOwrgNhA0DeBEBzC..."))
{
  "globalId": "RPGMV",
  "title": "OMORI",
  (...)
}
```
3. Change the values you wish to edit
4. Run `LZString.compressToBase64(JSON.stringify(object))`, where `object` is your edited save data
5. Save the output using `window.localStorage.setItem(key, data)` (remember to wrap the arguments in quotes)
6. Reload the site to see your new changes