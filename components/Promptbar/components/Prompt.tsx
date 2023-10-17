import {
  IconBulbFilled,
  IconCheck,
  IconTrash,
  IconWorld,
  IconWorldDownload,
  IconX,
} from '@tabler/icons-react';
import {
  DragEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Prompt } from '@/types/prompt';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';

import PromptbarContext from '../PromptBar.context';
import { PromptModal } from './PromptModal';
import HomeContext from '@/pages/api/home/home.context';
import { GlobalPrompt } from '@/types/globalPrompt';
import { AuthContext } from '@/contexts/authContext';

interface Props {
  prompt: Prompt;
}

export const PromptComponent = ({ prompt }: Props) => {
  const { user } = useContext(AuthContext);

  const {
    state: {
      apiKey,
      lightMode,
      globalPrompts,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      prompts,
      isGlobal
    },
    dispatch: homeDispatch,
    offGlobal,onGlobal
  } = useContext(HomeContext);
  const {
    dispatch: promptDispatch,
    handleUpdatePrompt,
    handleDeletePrompt,
  } = useContext(PromptbarContext);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const handleUpdate = (prompt: Prompt) => {
    handleUpdatePrompt(prompt);
    promptDispatch({ field: 'searchTerm', value: '' });
  };

  const handleDeletePromptFromDb=async()=>{
    const controller = new AbortController();
    const response = await fetch('/api/deletePrompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body:JSON.stringify(prompt)
      
    });
  }

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async(e) => {
   if(isGlobal && isDeleting)
    {
      let updatedGlobalPrompts=globalPrompts.filter((p)=>p.id!=prompt.id)
      localStorage.setItem('globalPrompts', JSON.stringify(updatedGlobalPrompts));

      homeDispatch({ field: 'globalPrompts', value: updatedGlobalPrompts });
      alert("Prompt deleted successfully from marketplace.")
      await handleDeletePromptFromDb()
    }
   if (!isGlobal && isDeleting) {
      handleDeletePrompt(prompt);
      promptDispatch({ field: 'searchTerm', value: '' });
    }

    setIsDeleting(false);
  };
  async function test(){
    const controller = new AbortController();
    const response = await fetch('/api/addPrompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body:JSON.stringify({...prompt, downloadCount:0,userId:(user as null | {id:string})?.id})
      
    });
  }
  const handleMakeGlobal:MouseEventHandler<HTMLButtonElement>=async(e)=>{
    e.stopPropagation();
    const isExist=globalPrompts.filter((p)=>p.id==prompt.id)
   if(isExist.length>0){
    alert("This prompt is already present in marketplace.")

   }
   else{
    let res=confirm('Are you sure you want to make it global?')
    if(res){
    
    localStorage.setItem('globalPrompts', JSON.stringify([...globalPrompts,{...prompt,downloadCount:0,userId:(user as null | {id:string})?.id}]));

    homeDispatch({ field: 'globalPrompts', value: [...globalPrompts,{...prompt,downloadCount:0,userId:(user as null | {id:string})?.id}] });
    alert("Prompt added to marketplace successfully.")
    onGlobal()
    const response=await test()

    }
  }
   

    
  //   //    const result=JSON.parse(response.body);


  }
  const handleCancelDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, prompt: Prompt) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('prompt', JSON.stringify(prompt));
    }
  };
 
  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);


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

    let foundObject = globalPrompts.find(obj => obj.id == prompt.id);
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
  return (
    <div className="relative flex items-center">
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
        draggable="true"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        onDragStart={(e) => handleDragStart(e, prompt)}
        onMouseLeave={() => {
          setIsDeleting(false);
          setIsRenaming(false);
          setRenameValue('');
        }}
      >
        <IconBulbFilled size={18} />

        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">
        {prompt.name} {isGlobal && !prompt.folderId && `(${(prompt as GlobalPrompt).downloadCount})`}        </div>
      </button>

      {(isDeleting || isRenaming) && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleDelete}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelDelete}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="absolute right-1 z-10 flex text-gray-300">
       
          {((!isGlobal) || (isGlobal && (user as null | {id:string})?.id==(prompt as any).userId)) && <SidebarActionButton handleClick={handleOpenDeleteModal}>
            <IconTrash size={18} />
            
          </SidebarActionButton>}
          {isGlobal && !prompt.folderId && <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
               handleDownload()
              
              }}
            >
              <Image
            width={20}
            style={{ background: 'transparent' }}
            height={20}
            src={'/Download_from_marketplace.png'}
            alt="download icon"
          /> 
              {/* <IconWorldDownload size={18} /> */}
            </SidebarActionButton>}
          {!isGlobal && !prompt.folderId && <SidebarActionButton handleClick={handleMakeGlobal}>
            <IconWorld size={18} />
            </SidebarActionButton>}
        </div>
      )}

      {showModal && (
        <PromptModal
          prompt={prompt}
          onClose={() => setShowModal(false)}
          onUpdatePrompt={handleUpdate}
          handleDownload={handleDownload}
        />
      )}
    </div>
  );
};
