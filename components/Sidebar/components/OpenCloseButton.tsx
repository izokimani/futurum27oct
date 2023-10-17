import { IconArrowBarLeft, IconArrowBarRight, IconMenu2, IconPlus } from '@tabler/icons-react';
import {useContext, useState} from 'react'
import { PromptModal } from '@/components/Promptbar/components/PromptModal';
import Image from 'next/image';
interface Props {
  onClick: any;
  handleCreateItem:any;
  side: 'left' | 'right';
}
import { v4 as uuidv4 } from 'uuid';
import HomeContext from '@/pages/api/home/home.context';
import { OpenAIModels } from '@/types/openai';
import { Prompt } from '@/types/prompt';
import { savePrompts } from '@/utils/app/prompts';


export const CloseSidebarButton = ({ onClick, side }: Props) => {
  const {
    state: { prompts, defaultModelId, showPromptbar, globalPrompts, lightMode },
    dispatch: homeDispatch,
    handleCreateFolder,
  } = useContext(HomeContext);
  return (
    <>
      <button
        className={`fixed top-5 ${
          side === 'right' ? 'right-[270px]' : 'left-[270px]'
        } z-50 h-7 w-7 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:${
          side === 'right' ? 'right-[270px]' : 'left-[270px]'
        } sm:h-8 sm:w-8 sm:text-neutral-700 mt-2`}
        onClick={onClick}
      >
        {side=="left" && <Image  src="/history.png" width={50} height={50} alt="burger_icon" /> }
        {side=="right" && <Image  src="/Templates.png" width={50} height={50} alt="burger_icon" /> }

      </button>
      
      <div
        onClick={onClick}
        className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
      ></div>
    </>
  );
};

export const OpenSidebarButton = ({ onClick, side ,handleCreateItem}: Props) => {
  const [isPromptModal,setIsPromptModal]=useState(false)
  const {
    state: { prompts, defaultModelId, showPromptbar, globalPrompts, lightMode },
    dispatch: homeDispatch,
    handleCreateFolder,
  } = useContext(HomeContext);
  const handleUpdate = (prompt: Prompt) => {
    const updatedPrompts = [...prompts, prompt];

    homeDispatch({ field: 'prompts', value: updatedPrompts });

    savePrompts(updatedPrompts);
  };

  const selectpromptbar=()=>{
    const textarea = document.getElementById('promptBarInput');
    if (textarea) {
      textarea.focus();
    }
  }
  return (
    <>
    {isPromptModal && defaultModelId && <PromptModal prompt= {{
        id: uuidv4(),
        name: `Prompt ${prompts.length + 1}`,
        description: '',
        content: '',
        model: OpenAIModels[defaultModelId],
        folderId: null,
      }}
      onUpdatePrompt={handleUpdate}
      handleDownload={()=>{}}
      onClose={() => setIsPromptModal(false)}
/>}
    <button
      className={`fixed top-2.5 ${
        side === 'right' ? 'right-2' : 'left-2'
      } z-50 h-7 w-7 text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:${
        side === 'right' ? 'right-2' : 'left-2'
      } sm:h-8 sm:w-12 sm:text-neutral-700 ml-4 mr-4 mt-2`}
    >
      
      {side === 'right' ?
       (<div style={{display:'flex'}}>{lightMode?<Image  src="/Templates.png" width={50} height={50} onClick={onClick} alt="burger_icon" />:<Image  src="/Templates.png" onClick={onClick} width={50} height={50} alt="burger_icon" />}</div>) :
       <div style={{display:'flex' }}>{lightMode ?<Image  src="/history.png" width={50} height={50} onClick={onClick} alt="burger_icon" />:<Image src="/history.png"  onClick={onClick} width={50} height={50} alt="burger_icon" />}</div>}
    </button>
    </>
  );
};
