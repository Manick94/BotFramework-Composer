// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// TODO: Remove path module
import Path from 'path';

import React, { useEffect, useRef, Fragment } from 'react';
import { RouteComponentProps, Router, navigate } from '@reach/router';
import { useRecoilValue } from 'recoil';

import { CreationFlowStatus } from '../../../constants';
import {
  dispatcherState,
  creationFlowStatusState,
  storagesState,
  focusedStorageFolderState,
  currentProjectIdState,
  userSettingsState,
  templateProjectsState,
  templateReadMeHtml,
} from '../../../recoilModel';
import Home from '../../../pages/home/Home';
import { useProjectIdCache } from '../../../utils/hooks';
import { ImportModal } from '../../ImportModal/ImportModal';
import { OpenProject } from '../OpenProject';

import { CreateOptionsV2 } from './CreateOptions';
import DefineConversationV2 from './DefineConversation';

type CreationFlowProps = RouteComponentProps<{}>;

const CreationFlowV2: React.FC<CreationFlowProps> = () => {
  const {
    fetchTemplatesV2,
    fetchStorages,
    fetchFolderItemsByPath,
    setCreationFlowStatus,
    createFolder,
    updateCurrentPathForStorage,
    updateFolder,
    saveTemplateId,
    fetchRecentProjects,
    openProject,
    saveProjectAs,
    fetchProjectById,
    createNewBotV2,
    fetchReadMe,
  } = useRecoilValue(dispatcherState);

  const templateProjects = useRecoilValue(templateProjectsState);
  const creationFlowStatus = useRecoilValue(creationFlowStatusState);
  const projectId = useRecoilValue(currentProjectIdState);
  const storages = useRecoilValue(storagesState);
  const templateReadMe = useRecoilValue(templateReadMeHtml);
  const focusedStorageFolder = useRecoilValue(focusedStorageFolderState);
  const { appLocale } = useRecoilValue(userSettingsState);
  const cachedProjectId = useProjectIdCache();
  const currentStorageIndex = useRef(0);
  const storage = storages[currentStorageIndex.current];
  const currentStorageId = storage ? storage.id : 'default';
  // const [formData, setFormData] = useState({ name: '', description: '', location: '' });

  useEffect(() => {
    if (storages && storages.length) {
      const storageId = storage.id;
      const path = storage.path;
      const formattedPath = Path.normalize(path);
      fetchFolderItemsByPath(storageId, formattedPath);
    }
  }, [storages]);

  const fetchResources = async () => {
    // fetchProject use `gotoSnapshot` which will wipe out all state value.
    // so here make those methods call in sequence.

    if (!projectId && cachedProjectId) {
      await fetchProjectById(cachedProjectId);
    }
    await fetchStorages();

    // TODO: add optional feedUrl param if users has added a feed URL through the UI
    fetchTemplatesV2([
      'https://registry.npmjs.org/-/v1/search?text=docker&size=100&from=0&quality=0.65&popularity=0.98&maintenance=0.5',
    ]);
    fetchRecentProjects();
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const updateCurrentPath = async (newPath, storageId) => {
    if (!storageId) {
      storageId = currentStorageId;
    }
    if (newPath) {
      const formattedPath = Path.normalize(newPath);
      updateCurrentPathForStorage(formattedPath, storageId);
    }
  };

  const handleDismiss = () => {
    setCreationFlowStatus(CreationFlowStatus.CLOSE);
    navigate(`/home`);
  };

  const openBot = async (botFolder) => {
    setCreationFlowStatus(CreationFlowStatus.CLOSE);
    openProject(botFolder);
  };

  const handleCreateNew = async (formData, templateId: string, qnaKbUrls?: string[]) => {
    const newBotData = {
      templateId: templateId || '',
      name: formData.name,
      description: formData.description,
      location: formData.location,
      schemaUrl: formData.schemaUrl,
      appLocale,
      qnaKbUrls,
      templateDir: formData.templateDir,
      eTag: formData.eTag,
      urlSuffix: formData.urlSuffix,
      alias: formData.alias,
      preserveRoot: formData.preserveRoot,
    };
    createNewBotV2(newBotData);
  };

  const handleSaveAs = (formData) => {
    saveProjectAs(projectId, formData.name, formData.description, formData.location);
  };

  const handleSubmit = async (formData, templateId: string) => {
    handleDismiss();
    switch (creationFlowStatus) {
      case CreationFlowStatus.SAVEAS:
        handleSaveAs(formData);
        break;

      default:
        saveTemplateId(templateId);
        await handleCreateNew(formData, templateId);
    }
  };

  const handleCreateNext = async (data: string) => {
    setCreationFlowStatus(CreationFlowStatus.NEW_FROM_TEMPLATE);
    navigate(`./create/${data}`);
  };

  return (
    <Fragment>
      <Home />
      <Router>
        <DefineConversationV2
          createFolder={createFolder}
          focusedStorageFolder={focusedStorageFolder}
          path="create/:templateId"
          updateFolder={updateFolder}
          onCurrentPathUpdate={updateCurrentPath}
          onDismiss={handleDismiss}
          onSubmit={handleSubmit}
        />
        <CreateOptionsV2
          fetchReadMe={fetchReadMe}
          fetchTemplates={fetchTemplatesV2}
          path="create"
          templateReadMe={templateReadMe}
          templates={templateProjects}
          onDismiss={handleDismiss}
          onNext={handleCreateNext}
        />
        <DefineConversationV2
          createFolder={createFolder}
          focusedStorageFolder={focusedStorageFolder}
          path=":projectId/:templateId/save"
          updateFolder={updateFolder}
          onCurrentPathUpdate={updateCurrentPath}
          onDismiss={handleDismiss}
          onSubmit={handleSubmit}
        />
        <OpenProject
          focusedStorageFolder={focusedStorageFolder}
          path="open"
          onCurrentPathUpdate={updateCurrentPath}
          onDismiss={handleDismiss}
          onOpen={openBot}
        />
        <ImportModal path="import" />
      </Router>
    </Fragment>
  );
};

export default CreationFlowV2;
