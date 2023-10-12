import { FC, KeyboardEvent, MouseEventHandler, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';
import SidebarActionButton from '@/components/Buttons/SidebarActionButton';
import { IconWorld } from '@tabler/icons-react';
import HomeContext from '@/pages/api/home/home.context';
import { updatePrompt } from '@/utils/app/prompts';
import { GlobalPrompt } from '@/types/globalPrompt';
import axios from 'axios';
import { AuthContext } from '@/contexts/authContext';
interface Props {
  prompt: Prompt ;
  onClose: () => void;
  onUpdatePrompt: (prompt: Prompt) => void;
  handleDownload:()=>void
}

export const PromptModal: FC<Props> = ({ prompt, onClose, onUpdatePrompt,handleDownload }) => {
  const { t } = useTranslation('promptbar');
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
    dispatch: homeDispatch,onGlobal, offGlobal
  } = useContext(HomeContext);
  const [name, setName] = useState(prompt?.name);
  const [description, setDescription] = useState(prompt?.description);
  const [content, setContent] = useState(prompt?.content);
  const [globalHappen,setGlobalHappen]=useState(false)
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onUpdatePrompt({ ...prompt, name, description, content: content.trim() });
      onClose();
    }
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      onClose();
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

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
  }
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onKeyDown={handleEnter}
    >
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-sm font-bold text-black dark:text-neutral-200">
              {t('Name')}
            </div>
            <input
              ref={nameInputRef}
              style={{
                backgroundColor: lightMode=="light" ? "white" : "black",
                color: lightMode=="light" ? "black" : "white",
                borderColor: lightMode=="light" ? "black" : "white"
              }} 
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              placeholder={t('A name for your prompt.') || ''}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Description')}
            </div>
            <textarea
             style={{
              backgroundColor: lightMode=="light" ? "white" : "black",
              color: lightMode=="light" ? "black" : "white",
              borderColor: lightMode=="light" ? "black" : "white",
              resize:"none"
            }} 
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              placeholder={t('A description for your prompt.') || ''}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Prompt')}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              style={{
                backgroundColor: lightMode=="light" ? "white" : "black",
                color: lightMode=="light" ? "black" : "white",
                borderColor: lightMode=="light" ? "black" : "white",
                resize:'none'
              }} 
              placeholder={
                t(
                  'Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}',
                ) || ''
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:"20px"}}>

            <button
              type="button"
              style={{width:isGlobal?"100%":"85%"}}
              className=" px-4 py-2  border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
              onClick={() => {
                if(isGlobal){
                  handleDownload();
                  onClose()
                }
                else{
               // if(globalHappen){
                const updatedPrompt = {
                  ...prompt,
                  name,
                  description,
                  content: content.trim(),
                };

                onUpdatePrompt(updatedPrompt);
             // }
                onClose();
            }
              }}
            >
              {isGlobal?t('Add'):t('Save')}
            </button>
          {!isGlobal &&  <SidebarActionButton   handleClick={handleMakeGlobal}>
            <IconWorld size={34} onClick={()=>{setGlobalHappen(true);onUpdatePrompt({...prompt,name,description,content:content.trim()});onClose()}} />
            </SidebarActionButton>} 
          </div>        </div>
        </div>
      </div>
    </div>
  );
};
