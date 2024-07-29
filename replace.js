const fs = require("fs");
const path = require("path");

let dirList = fs.readdirSync(path.resolve("./www/"), { recursive: true });
let audioFiles = new Array();
let jsonFiles = new Array();

/**
 *
 * @param {string[]} dirList
 */
function traverseDirectory(dirList) {
  for (let index = 0; index < dirList.length; index++) {
    let file = dirList[index];
    if (file.endsWith(".ogg")) {
      audioFiles.push(file);
    } else if (file.endsWith(".json") && !file.includes(".vscode")) {
      jsonFiles.push(file);
    }
  }
}

/**
 *
 * @param {object} jsonObj JSON Object
 */
function checkIsAudio(jsonObj) {
  let hasName = jsonObj.hasOwnProperty("name");
  let hasVolume = jsonObj.hasOwnProperty("volume");
  let hasPitch = jsonObj.hasOwnProperty("pitch");
  if (!hasName && !hasVolume && !hasPitch) {
    // check if code 655 and calls AudioManager
    let code = jsonObj.hasOwnProperty("code") ? jsonObj["code"] : -1;
    let javascript =
      code === 655 && jsonObj.hasOwnProperty("parameters")
        ? jsonObj["parameters"][0]
        : null;
    if (
      javascript !== null &&
      typeof javascript === "string" &&
      javascript.includes("AudioManager.play")
    ) {
      return true;
    }
  }
  return hasName && hasVolume && hasPitch;
}

/**
 *
 * @param {object} jsonObj JSON Object
 */
function traverseJSON(jsonObj) {
  let audio = [];
  for (const key in jsonObj) {
    if (!jsonObj.hasOwnProperty(key)) {
      continue;
    }
    const element = jsonObj[key];
    if (typeof element != "object" || element === null) {
      continue;
    }
    const isAudio = checkIsAudio(element);
    if (!isAudio) {
      const response = traverseJSON(element);
      if (response.length != 0) {
        response.forEach((element) => {
          if (audio.indexOf(element) === -1) {
            audio.push(element);
          }
        });
      }
    } else {
      let re = /AudioManager\.play.+?\((\{.+?\}|(.+?),.+?)\)/;
      let audioName = element.hasOwnProperty("name")
        ? element.name
        : element["parameters"][0].match(re)[2] ||
          eval(
            "(" +
              element["parameters"][0]
                .match(re)[1]
                .replace("volume * rate", 0) +
              ")",
          )["name"];
      if (audio.indexOf(audioName) !== -1 || !audioName) {
        continue;
      }
      audio.push(audioName);
    }
  }
  return audio;
}

/**
 *
 * @param {string} jsonFile A path to a JSON file
 */
function checkIsMap(jsonFile) {
  const basename = path.basename(jsonFile);
  return basename.includes("Map") && basename !== "MapInfos.json";
}

/**
 *
 * @param {string} jsonFile A path to a JSON file
 */
function evaluateJSON(jsonFile) {
  const jsonContents = fs.readFileSync(path.resolve("./www/" + jsonFile));
  const json = JSON.parse(jsonContents);
  const isMap = checkIsMap(jsonFile);
  let names = [];
  let result = [];
  if (isMap) {
    if (json.bgm.name) {
      names.push(json.bgm.name);
    }
    if (json.bgs.name) {
      names.push(json.bgs.name);
    }
    result = traverseJSON(json["events"]);
  } else {
    result = traverseJSON(json);
  }

  if (result.length !== 0) {
    result.forEach((element) => {
      names.push(element);
    });
  }

  return names;
}

traverseDirectory(dirList);

let finalResult = {};

for (let index = 0; index < jsonFiles.length; index++) {
  const file = jsonFiles[index];
  const result = evaluateJSON(file);
  if (result.length === 0) {
    continue;
  }
  finalResult[file] = result;
}

for (let i = 0; i < audioFiles.length; i++) {
  const path = require("path");
  const audioFile = path.basename(audioFiles[i]);
  const noExtensionFile = audioFile.replace(".ogg", "");
  let incorrectCase = {};

  for (const key in finalResult) {
    if (!finalResult.hasOwnProperty(key)) {
      continue;
    }
    const json = finalResult[key];
    json.forEach((name) => {
      if (
        name.toLowerCase() == noExtensionFile.toLowerCase() &&
        name != noExtensionFile
      ) {
        if (!incorrectCase.hasOwnProperty(key)) {
          incorrectCase[key] = [];
        }
        if (incorrectCase[key].indexOf(name) === -1) {
          incorrectCase[key].push(name);
        }
      }
    });
  }

  if (!Object.keys(incorrectCase).length) {
    continue;
  }

  for (const key in incorrectCase) {
    if (!incorrectCase.hasOwnProperty(key)) {
      continue;
    }
    const value = incorrectCase[key];
    const filePath = path.resolve("./www/" + key);
    let file = fs.readFileSync(filePath, "utf-8");
    let content = file;
    let archive = content;
    let foundMatches = false;
    value.forEach((mismatch) => {
      console.log(key, mismatch, noExtensionFile);
      if (!foundMatches) {
        foundMatches =
          content.includes('"' + mismatch + '"') ||
          content.includes('\\"' + mismatch + '\\"');
      }
      content = content.replaceAll(
        '"' + mismatch + '"',
        '"' + noExtensionFile.toString() + '"',
      );
      content = content.replaceAll(
        '\\"' + mismatch + '\\"',
        '\\"' + noExtensionFile.toString() + '\\"',
      );
    });
    if (archive === content && foundMatches) {
      console.warn(key + " replaceAll changed nothing!");
    }
    fs.writeFileSync(filePath, content, "utf-8");
  }
}
