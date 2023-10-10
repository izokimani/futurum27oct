import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getSettings } from '@/utils/app/settings';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { GlobalFolderInterface } from '@/types/globalFolder';
import { GlobalPrompt } from '@/types/globalPrompt';
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
      isAutoHide,
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getModels(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    // const updatedConversations: Conversation[] = conversations.map((c) => {
    //   if (c.folderId === folderId) {
    //     return {
    //       ...c,
    //       folderId: null,
    //     };
    //   }

    //   return c;
    // });
    const updatedConversations = conversations.filter(
      (c) => c.folderId != folderId,
    );

    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    // const updatedPrompts: Prompt[] = prompts.map((p) => {
    //   if (p.folderId === folderId) {
    //     return {
    //       ...p,
    //       folderId: null,
    //     };
    //   }

    //   return p;
    // });

    const updatedPrompts = prompts.filter((p) => p.folderId != folderId);
    dispatch({ field: 'prompts', value: updatedPrompts });
    alert('Folder delete successfully.');
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: 'folders', value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const onGlobal = () => {
    dispatch({ field: 'isGlobal', value: true });
  };
  const onPluginSelect = () => {
    dispatch({ field: 'showPluginSelect', value: true });
  };
  const offPluginSelect = () => {
    dispatch({ field: 'showPluginSelect', value: false });
  };
  const offGlobal = () => {
    dispatch({ field: 'isGlobal', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD --------------------------------------------
  function test2() {
    const config = {
      method: 'get',
      url: `https://chat.futurum.one/.netlify/functions/getFolders`,
    };
    return axios(config)
      .then((response) => {
        return {
          statusCode: 200,
          body: JSON.stringify(response.data),
        };
      })
      .catch((error) => {
        // console.log(error)
        return {
          statusCode: 422,
          body: `Error: ${error}`,
        };
      });
  }
  function test() {
    const config = {
      method: 'get',
      url: `https://chat.futurum.one/.netlify/functions/getPrompts`,
    };
    return axios(config)
      .then((response) => {
        return {
          statusCode: 200,
          body: JSON.stringify(response.data),
        };
      })
      .catch((error) => {
        //console.log(error)
        return {
          statusCode: 422,
          body: `Error: ${error}`,
        };
      });
  }

  const setColors = () => {
    const storedColors = localStorage.getItem('folderColors');
    if (storedColors) {
      dispatch({ field: 'folderColors', value: JSON.parse(storedColors) });
    } else {
      dispatch({ field: 'folderColors', value: [] });
      localStorage.setItem('folderColors', JSON.stringify([]));
    }
  };
  const getGlobalTemplatesFromDb = async () => {
    // const response=await test();
    const controller = new AbortController();
    const response = await fetch('/api/getPrompts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    const result = await response.json();
    result.sort((a: GlobalPrompt, b: GlobalPrompt) => {
      const downloadCountA = a.downloadCount || 0; // Default to 0 if downloadCount is missing or falsy
      const downloadCountB = b.downloadCount || 0; // Default to 0 if downloadCount is missing or falsy

      return downloadCountA - downloadCountB;
    });
    localStorage.setItem('globalPrompts', JSON.stringify(result));
    dispatch({ field: 'globalPrompts', value: result });
  };
  const getGlobalFoldersFromDb = async () => {
    //const response=await test2();
    const controller = new AbortController();
    const response = await fetch('/api/getFolders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    const result = await response.json();
    localStorage.setItem('globalFolders', JSON.stringify(result));
    dispatch({ field: 'globalFolders', value: result });
    dispatch({ field: 'finalGlobalFolder', value: result });
  };
  //awais
  // const getGlobalFoldersFromDbByDate = async () => {
  //   //const response=await test2();
  //   const controller = new AbortController();
  //   const response = await fetch('/api/getGlobeFolderByDate', {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     signal: controller.signal,
  //   });
  //   const result = await response.json();
  //   localStorage.setItem('globalFoldersByDate', JSON.stringify(result));
  //   dispatch({ field: 'globalFolderByDate', value: result });
  // };

  // const getGlobalTemplateFromDbByDate = async () => {
  //   //const response=await test2();
  //   const controller = new AbortController();
  //   const response = await fetch('/api/getGlobalTemplatesByDate', {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     signal: controller.signal,
  //   });
  //   const result = await response.json();
  //   localStorage.setItem('globalTemplateByDate', JSON.stringify(result));
  //   dispatch({ field: 'globalPromptByDate', value: result });
  // };

  const checkAutoHideSidebar = () => {
    let storedValue = localStorage.getItem('isAutoHide');
    if (storedValue) {
      dispatch({ field: 'isAutoHide', value: JSON.parse(storedValue) });
    } else {
      localStorage.setItem('isAutoHide', JSON.stringify(isAutoHide));
    }
  };

  const myTest = async () => {
    const controller = new AbortController();
    const response = await fetch('/api/getPrompts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    // console.log(await response.json())
  };
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    // const apiKey = localStorage.getItem('apiKey');

    // if (serverSideApiKeyIsSet) {
    //   dispatch({ field: 'apiKey', value: '' });

    //   // localStorage.removeItem('apiKey');
    // } else if (apiKey) {
    //   dispatch({ field: 'apiKey', value: apiKey });
    // }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      dispatch({ field: 'pluginKeys', value: pluginKeys });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem('prompts');
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) });
    }
    // myTest()
    getGlobalTemplatesFromDb();
    //getGlobalTemplateFromDbByDate();
    //getGlobalFoldersFromDbByDate();
    if(localStorage.getItem('globalTemplatesByDate')) {
      localStorage.removeItem('globalTemplatesByDate');
  }
  if(localStorage.getItem('globalTemplateByDate')) {
    localStorage.removeItem('globalTemplateByDate');
}
  if(localStorage.getItem('globalFoldersByDate')) {
    localStorage.removeItem('globalFoldersByDate');
}
    getGlobalFoldersFromDb();
    setColors();
    checkAutoHideSidebar();
    const conversationHistory = localStorage.getItem('conversationHistory');
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory);
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      );

      dispatch({ field: 'conversations', value: cleanedConversationHistory });
    }

    const selectedConversation = localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      });
    } else {
      const lastConversation = conversations[conversations.length - 1];
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });
    }
  }, [
    defaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        onGlobal,
        offGlobal,
        onPluginSelect,
        offPluginSelect,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      <Head>
        <title>Futurum One</title>
        <meta name="description" content="Private AI" />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>

            <Promptbar />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};
