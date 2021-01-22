const { exec } = require("child_process");
const promisify = require("util").promisify;
const fs = require('fs')
const {homedir} = require('os')
const execAsync = promisify(exec);
const { fixPathForAsarUnpack } = require("electron-util");
const path = require('path')
const { showErrorBox } = require('electron').dialog
const axios = require('axios')

const home = homedir();
const legendaryConfigPath = path.join(`${home}`,'.config', 'legendary');
const heroicFolder = path.join(`${home}`, '.config', 'heroic');
const heroicConfigPath = path.join(`${heroicFolder}`, 'config.json');
const heroicGamesConfigPath =path.join(`${heroicFolder}`, 'GamesConfig');
const userInfo = path.join(`${legendaryConfigPath}`,'user.json');
const heroicInstallPath = path.join(`${home}`,'Games', 'Heroic');
const legendaryBin = fixPathForAsarUnpack(path.join(__dirname, "/bin/legendary.exe"));
const icon = fixPathForAsarUnpack(path.join(__dirname, "/icon.png"));
const loginUrl = "https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fredirect";
const sidInfoUrl = "https://github.com/flavioislima/HeroicGamesLauncher/issues/42"

const isLoggedIn = () => fs.existsSync(userInfo);

const launchGame = async (appName) => {
      let envVars = ""
      let dxvkPrefix = ""
      let gameMode
      
      const gameConfig = path.join(`${heroicGamesConfigPath}`, `${appName}.json`)
      const globalConfig = heroicConfigPath
      let settingsPath = gameConfig
      let settingsName = appName
      
      if (!fs.existsSync(gameConfig)) {
        settingsPath = globalConfig
        settingsName = 'defaultSettings'
      }
      
      const command = `${legendaryBin} launch ${appName}`
      console.log('\n Launch Command:', command);
    
      return execAsync(command)
      .then(({ stderr }) => {
          fs.writeFile(path.join(`${heroicGamesConfigPath}`, `${appName}`) + '-lastPlay.log', stderr, () => 'done')
          if (stderr.includes('Errno')){
            showErrorBox(
              "Something Went Wrong",
              "Error when launching the game, check the logs!"
            )
          }
        })
        .catch(console.log)
}

const writeDefaultconfig = () => {
  const config = {
    defaultSettings: {
      defaultInstallPath: heroicInstallPath,
      otherOptions: ""
    }
  }
  if (!fs.existsSync(heroicConfigPath)) {
    fs.writeFile(heroicConfigPath, JSON.stringify(config, null, 2), () => {
      return "done";
    });
  }

  if (!fs.existsSync(heroicGamesConfigPath)) {
    fs.mkdir(heroicGamesConfigPath, { recursive: true }, () => {
      return "done";
    })
  }
}

const writeGameconfig = (game) => {
    
  if (fs.existsSync(heroicConfigPath)) {
    const { otherOptions } = JSON.parse(fs.readFileSync(heroicConfigPath)).defaultSettings
    const config = {
      [game]: {
        otherOptions
      }
    }
  }
  else {
    const config = {
      defaultSettings: {
        defaultInstallPath: heroicInstallPath,
        otherOptions: ""
      }
    }
        
    fs.writeFileSync(heroicConfigPath, JSON.stringify(config, null, 2), () => {
      return "done";
    });
  }

  if (!fs.existsSync(path.join(`${heroicGamesConfigPath}`,`${game}.json`))) {
    const config = {
      [game]: {
        otherOptions: ""
      }
    }
      fs.writeFileSync(path.join(`${heroicGamesConfigPath}`,`${game}.json`), JSON.stringify(config, null, 2), () => {
      return "done";
    });
  }
}
    
module.exports = {
  isLoggedIn,
  launchGame,
  writeDefaultconfig,
  writeGameconfig,
  userInfo,
  heroicConfigPath,
  heroicFolder,
  heroicGamesConfigPath,
  legendaryConfigPath,
  legendaryBin,
  icon,
  home,
  loginUrl,
  sidInfoUrl
}