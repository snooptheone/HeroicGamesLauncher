import { IpcRendererEvent } from "electron";
import React, { useEffect, useState } from "react";
import { NavLink, useParams } from 'react-router-dom';
import { getGameInfo, writeConfig } from "../../helper";
import { AppSettings } from '../../types';
import Header from "../UI/Header";
import GeneralSettings from './GeneralSettings';
import SyncSaves from './SyncSaves';


const {
  ipcRenderer,
} = window.require("electron");

interface RouteParams {
  appName: string;
  type: string;
}

// TODO: add option to add Custom wine
// TODO: add feedback when launching winecfg and winetricks

export default function Settings() {
  
  const [defaultInstallPath, setDefaultInstallPath] = useState("");
  const [egsLinkedPath, setEgsLinkedPath] = useState("")
  const [egsPath, setEgsPath] = useState(egsLinkedPath);
  const [savesPath, setSavesPath] = useState('');
  const [haveCloudSaving, setHaveCloudSaving] = useState({cloudSaveEnabled: false, saveFolder: ""});
  const [autoSyncSaves, setAutoSyncSaves] = useState(false)
  const { appName, type } = useParams() as RouteParams;
  const isDefault = appName === 'default'
  const isGeneralSettings = type === 'general'
  const isSyncSettings = type === 'sync'

  const settings = isDefault ? 'defaultSettings' : appName

  useEffect(() => {
    ipcRenderer.send("requestSettings", appName);
    ipcRenderer.once(
      settings,
      async (event: IpcRendererEvent, config: AppSettings) => {
        setDefaultInstallPath(config.defaultInstallPath);
        setEgsLinkedPath(config.egsLinkedPath || "")
        setEgsPath(config.egsLinkedPath || "")
        setSavesPath(config.savesPath || "")
        setAutoSyncSaves(config.autoSyncSaves)
        if (!isDefault){
          const {cloudSaveEnabled, saveFolder} = await getGameInfo(appName)
          setHaveCloudSaving({cloudSaveEnabled, saveFolder})
        }
      }
    );
  }, [appName, settings, type, isDefault]);

    const GlobalSettings = {
        defaultSettings: {
          defaultInstallPath,
          egsLinkedPath
        },
    }

    const GameSettings = {
      [appName]: {
        savesPath,
        autoSyncSaves
      },
    }

    const settingsToSave = isDefault ? GlobalSettings : GameSettings
    const returnPath = isDefault ? '/' : `/gameconfig/${appName}`

    useEffect(() => {
      writeConfig([appName, settingsToSave])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [GlobalSettings, GameSettings, appName])
  
    return (
    <>
      <Header goTo={returnPath} renderBackButton />
      <div className="Settings">
        <div className='settingsNavbar'>
          {isDefault && 
          <NavLink to={{ pathname: '/settings/default/general' }}>
              General
          </NavLink>}
          
          {(!isDefault && haveCloudSaving.cloudSaveEnabled) && 
          <NavLink to={{ pathname: `/settings/${appName}/sync`}}>
            Sync
          </NavLink>}
        </div>
        <div className="settingsWrapper">
          {isGeneralSettings &&
            <GeneralSettings 
              egsPath={egsPath} 
              setEgsPath={setEgsPath} 
              egsLinkedPath={egsLinkedPath}
              setEgsLinkedPath={setEgsLinkedPath}
              defaultInstallPath={defaultInstallPath} 
              setDefaultInstallPath={setDefaultInstallPath}
            />          
          }          
          {isSyncSettings &&
            <SyncSaves 
              savesPath={savesPath}
              setSavesPath={setSavesPath}
              appName={appName}
              saveFolder={haveCloudSaving.saveFolder}
              autoSyncSaves={autoSyncSaves}
              setAutoSyncSaves={setAutoSyncSaves}
            />
          }
          <span className="save">
              Settings are saved automatically
          </span>
        </div>
      </div>
    </>
  );
}
