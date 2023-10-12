import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { savePrompts } from '@/utils/app/prompts';

import { OpenAIModels } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { PromptFolders } from './components/PromptFolders';
import { PromptbarSettings } from './components/PromptbarSettings';
import { Prompts } from './components/Prompts';

import Sidebar from '../Sidebar';
import PromptbarContext from './PromptBar.context';
import { PromptbarInitialState, initialState } from './Promptbar.state';

import { v4 as uuidv4 } from 'uuid';
import { PromptModal } from './components/PromptModal';
import { GlobalPrompt } from '@/types/globalPrompt';

const Promptbar = () => {
  const { t } = useTranslation('promptbar');
  const [showModal, setShowModal]=useState(false)
  const [currentPrompt, setCurrentPrompt]=useState<Prompt>()
  const promptBarContextValue = useCreateReducer<PromptbarInitialState>({
    initialState,
  });

  const {
    state: {
      prompts,
      defaultModelId,
      showPromptbar,
      globalPrompts,
      isGlobal,
      globalFolders,
      finalGlobalFolder,
    },
    dispatch: homeDispatch,
    offGlobal,onGlobal,

    handleCreateFolder,
  } = useContext(HomeContext);

  const {
    state: {
      searchTerm,
      filteredPrompts,
      filteredGlobalPrompts,
      fillerSearchTerm,
      filterOption,
    },
    dispatch: promptDispatch,
  } = promptBarContextValue;
  const handleTogglePromptbar = () => {
    homeDispatch({ field: 'showPromptbar', value: !showPromptbar });
    localStorage.setItem('showPromptbar', JSON.stringify(!showPromptbar));
  };

  const handleCreatePrompt = () => {

    if (defaultModelId) {
      const newPrompt: Prompt = {
        id: uuidv4(),
        name: `Prompt ${prompts.length + 1}`,
        description: '',
        content: '',
        model: OpenAIModels[defaultModelId],
        folderId: null,
      };

      setCurrentPrompt(newPrompt)
      setShowModal(true)
      const updatedPrompts = [...prompts, newPrompt];

      homeDispatch({ field: 'prompts', value: updatedPrompts });

      savePrompts(updatedPrompts);
    }
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.filter((p) => p.id !== prompt.id);

    homeDispatch({ field: 'prompts', value: updatedPrompts });
    alert('Prompt delete successfully.');
    savePrompts(updatedPrompts);
  };

  const handleUpdatePrompt = (prompt: Prompt) => {
    const updatedPrompts = prompts.map((p) => {
      if (p.id === prompt.id) {
        return prompt;
      }

      return p;
    });
    homeDispatch({ field: 'prompts', value: updatedPrompts });

    savePrompts(updatedPrompts);
  };

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const prompt = JSON.parse(e.dataTransfer.getData('prompt'));

      const updatedPrompt = {
        ...prompt,
        folderId: e.target.dataset.folderId,
      };

      handleUpdatePrompt(updatedPrompt);
      e.target.style.background = 'none';
    }
  };

  useEffect(() => {
    if (searchTerm) {
      // console.log(searchTerm);
      if (!isGlobal)
        promptDispatch({
          field: 'filteredPrompts',
          value: prompts.filter((prompt) => {
            const searchable = prompt.name.toLowerCase();
            return searchable.includes(searchTerm.toLowerCase());
          }),
        });
      else
        promptDispatch({
          field: 'filteredGlobalPrompts',
          value: globalPrompts.filter((prompt) => {
            const searchable = prompt.name.toLowerCase();
            return searchable.includes(searchTerm.toLowerCase());
          }),
        });
    } else {
      promptDispatch({ field: 'filteredPrompts', value: prompts });
      promptDispatch({ field: 'filteredGlobalPrompts', value: globalPrompts });
    }
  }, [searchTerm, prompts, globalPrompts]);


  const updatePromptCount=async(updatedPrompt:GlobalPrompt|undefined)=>{
    const controller = new AbortController();
    const response = await fetch('/api/updatePrompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body:JSON.stringify(updatedPrompt)
      
    });
  }

  const handleDownload=async()=>{

    let foundObject = globalPrompts.find(obj => obj.id == currentPrompt?.id);
    if(foundObject){
      foundObject.downloadCount++;
    }
    globalPrompts.sort((a:GlobalPrompt, b:GlobalPrompt) => {
      const downloadCountA = a.downloadCount || 0; // Default to 0 if downloadCount is missing or falsy
      const downloadCountB = b.downloadCount || 0; // Default to 0 if downloadCount is missing or falsy
    
      return downloadCountA - downloadCountB;
    });
     localStorage.setItem('globalPrompts',JSON.stringify(globalPrompts))
    homeDispatch({ field: 'globalPrompts', value: [...globalPrompts] });


    localStorage.setItem('prompts', JSON.stringify([...prompts,prompt]));

    homeDispatch({ field: 'prompts', value: [...prompts,prompt] });
    alert("Prompt downloaded successfully.")
    offGlobal()  
    await updatePromptCount(foundObject)



  }
  useEffect(() => {
    if (fillerSearchTerm) {
      if (filterOption === 'created date') {
        // homeDispatch({ field: 'globalFolders', value: globalFolderByDate });
      } else {
        homeDispatch({ field: 'globalFolders', value: finalGlobalFolder });
      }
      promptDispatch({
        field: 'filteredGlobalPrompts',
        value: globalPrompts.filter((prompt) => {
          const searchable = prompt.name.toLowerCase();
          return searchable.includes(fillerSearchTerm.toLowerCase());
        }),
      });
    } else {
      homeDispatch({ field: 'globalFolders', value: finalGlobalFolder });
      promptDispatch({ field: 'filteredGlobalPrompts', value: globalPrompts });
    }
  }, [fillerSearchTerm]);

  return (
    <PromptbarContext.Provider
      value={{
        ...promptBarContextValue,
        handleCreatePrompt,
        handleDeletePrompt,
        handleUpdatePrompt,
      }}
    >
      <Sidebar<Prompt>
        side={'right'}
        isOpen={showPromptbar}
        addItemButtonTitle={t('New Template')}
        itemComponent={
          <Prompts
            prompts={filteredPrompts.filter((prompt) => !prompt.folderId)}
          />
        }
        globalItemComponent={
          <Prompts
            prompts={filteredGlobalPrompts.filter((prompt) => !prompt.folderId)}
          />
        }
        folderComponent={<PromptFolders />}
        globalFolderComponent={<PromptFolders />}
        items={filteredPrompts}
        globalItems={globalPrompts}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) => {
          promptDispatch({ field: 'searchTerm', value: searchTerm });
        }}
        handleFilter={(searchTerm: string, option: string) => {
          promptDispatch({
            field: 'filterOption',
            value: option,
          });
          promptDispatch({
            field: 'fillerSearchTerm',
            value: searchTerm,
          });
        }}
        toggleOpen={handleTogglePromptbar}
        handleCreateItem={handleCreatePrompt}
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'prompt')}
        handleDrop={handleDrop}
      />
         {showModal && (
        <PromptModal
          prompt={currentPrompt as Prompt}
          onClose={() => setShowModal(false)}
          onUpdatePrompt={handleUpdatePrompt}
          handleDownload={handleDownload}
        />
      )}
    </PromptbarContext.Provider>
  );
};

export default Promptbar;
