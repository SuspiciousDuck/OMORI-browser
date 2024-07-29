# OMORI-browser
This guide will only have instructions for a Linux host, if you're on Windows, you can use WSL.
# Table of contents:
1. [Steps](#steps)
2. [Minify files](#bonus-steps-minify-files-to-decrease-network-load)
3. [Delete encrypted files](#bonus-steps-save-on-storage-space-by-deleting-encrypted-files-if-present)
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
## Bonus steps: Minify files to decrease network load
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
## Bonus steps: Save on storage space by deleting encrypted files (if present)
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