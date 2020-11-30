// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExtensionRegistration } from '@botframework-composer/types';

// this will be called by composer
function initialize(registration: IExtensionRegistration) {
  const plugin1 = {
    name: 'samplePublishPlugin1',
    description: 'Publish using custom UI',
    bundleId: 'publish' /** we have custom UI to host */,
    publish,
    getStatus,
  };
  const plugin2 = {
    name: 'samplePublishPlugin2',
    description: 'Publish using custom UI (2)',
    bundleId: 'publish2' /** we have custom UI to host */,
    publish,
    getStatus,
  };
  registration.addPublishMethod(plugin1);
  registration.addPublishMethod(plugin2);

  // test reading and writing data
  registration.log('Reading from store:\n%O', registration.store.readAll());

  registration.store.replace({ some: 'data' });
  registration.log('Reading from store:\n%O', registration.store.readAll());

  registration.context.on('project:opened', async (project) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        registration.log('project:opened %O', project.id);
        resolve();
      }, 2000);
    });
  });

  registration.context.on('project:created', async (project) => {
    const lg = `
# my_func
- hello
- world
    `;
    project.updateFile('common.lg', lg);
  });
}

async function getStatus(config, project, user) {
  const response = {
    status: 200,
    result: {
      time: new Date(),
      message: 'Publish successful.',
      log: '',
    },
  };
  return response;
}

async function publish(config, project, metadata, user) {
  const response = {
    status: 202,
    result: {
      time: new Date(),
      message: 'Publish accepted.',
      log: '',
      comment: metadata.comment,
    },
  };
  return response;
}

module.exports = {
  initialize,
};
