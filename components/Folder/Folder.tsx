import {
  IconCaretDown,
  IconCaretRight,
  IconCheck,
  IconPalette,
  IconPencil,
  IconTrash,
  IconWorld,
  IconWorldDownload,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import {
  KeyboardEvent,
  MouseEventHandler,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import { TwitterPicker } from 'react-color';

import { FolderInterface } from '@/types/folder';
import { GlobalFolderInterface } from '@/types/globalFolder';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';

import ColorCodes from '../ColorCodes';
import PromptbarContext from '../Promptbar/PromptBar.context';

import { AuthContext } from '@/contexts/authContext';
import axios from 'axios';

interface Props {
  currentFolder: FolderInterface;
  searchTerm: string;
  handleDrop: (e: any, folder: FolderInterface) => void;
  folderComponent: (ReactElement | undefined)[];
  filterSearchTerm: string;
}

const Folder = ({
  currentFolder,
  searchTerm,
  handleDrop,
  folderComponent,
  filterSearchTerm,
}: Props) => {
  const {
    state: {
      isGlobal,
      globalFolders,
      globalPrompts,
      prompts,
      folderColors,
      lightMode,
      folders,
    },
    handleDeleteFolder,
    handleUpdateFolder,
    dispatch: homeDispatch,
    onGlobal,
    offGlobal,
  } = useContext(HomeContext);
  // const {
  //   state,
  //   handleUpdatePrompt,
  // } = useContext(PromptbarContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const { user, login, logout, userRole, setToken, authReady } =
    useContext(AuthContext);

  const [color, setColor] = useState({
    background: '',
    text: '',
  });
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isChangeColor, setIsChangeColor] = useState(false);
  const [changeWhat, setChangeWhat] = useState('background');
  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  const handleRename = () => {
    handleUpdateFolder(currentFolder.id, renameValue);
    setRenameValue('');
    setIsRenaming(false);
  };

  const dropHandler = (e: any) => {
    if (e.dataTransfer) {
      setIsOpen(true);

      handleDrop(e, currentFolder);

      e.target.style.background = 'none';
    }
  };

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };
  async function test() {
    const controller = new AbortController();
    const response = await fetch('/api/addFolders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        ...currentFolder,
        downloadCount: 0,
        userId: (user as null | { id: string })?.id,
      }),
    });
  }
  async function addFolderPrompts(myPrompts: Prompt[]) {
    const controller = new AbortController();
    const response = await fetch('/api/addFolderPrompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(myPrompts),
    });
  }
  const handleMakeGlobal: MouseEventHandler<HTMLButtonElement> = async (e) => {
    const isExist = globalFolders.filter(
      (folder) => folder.id == currentFolder.id,
    );
    if (isExist.length > 0) {
      alert('This folder is already present in marketplace.');
    } else {
      e.stopPropagation();
      let res = confirm('Are you sure you want to make it global?');
      if (res) {
        const myPrompts = prompts.filter(
          (prompt) => prompt.folderId == currentFolder.id,
        );
        localStorage.setItem(
          'globalFolders',
          JSON.stringify([
            ...globalFolders,
            {
              ...currentFolder,
              downloadCount: 0,
              userId: (user as null | { id: string })?.id,
            },
          ]),
        );

        homeDispatch({
          field: 'globalFolders',
          value: [
            ...globalFolders,
            {
              ...currentFolder,
              downloadCount: 0,
              userId: (user as null | { id: string })?.id,
            },
          ],
        });
        alert('Folder added to marketplace successfully.');
        onGlobal();
        await test();
        await addFolderPrompts(myPrompts);
      }
    }
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  useEffect(() => {
    if (searchTerm || filterSearchTerm) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm, filterSearchTerm]);

  const handleChangeComplete = (color: any) => {
    if (changeWhat == 'background')
      setColor((old) => ({ ...old, background: color.hex }));
    else {
      setColor((old) => ({ ...old, text: color.hex }));
    }

    let item = folderColors.find((obj) => obj.folderId == currentFolder.id);
    if (item) {
      if (changeWhat == 'background') item.backgroundColor = color.hex;
      else item.textColor = color.hex;
      item.folderId = currentFolder.id;
      homeDispatch({ field: 'folderColors', value: [...folderColors] });
      localStorage.setItem('folderColors', JSON.stringify([...folderColors]));
    } else {
      let newColor = {
        textColor: color.text,
        backgroundColor: color.background,
        folderId: currentFolder.id,
      };
      homeDispatch({
        field: 'folderColors',
        value: [...folderColors, newColor],
      });
      localStorage.setItem(
        'folderColors',
        JSON.stringify([...folderColors, newColor]),
      );
    }
    setIsChangeColor(false);
  };

  useEffect(() => {
    let newColor = folderColors.find(
      (color) => color.folderId == currentFolder.id,
    );
    if (newColor) {
      setColor({
        ...color,
        background: newColor.backgroundColor,
        text: newColor.textColor,
      });
    }
  }, []);

  const updatePromptCount = async (
    updatedPrompt: GlobalFolderInterface | undefined,
  ) => {
    const controller = new AbortController();
    const response = await fetch('/api/updateFolder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(updatedPrompt),
    });
  };
  const handleDownload = async () => {
    let foundObject = globalFolders.find((obj) => obj.id == currentFolder.id);
    if (foundObject) {
      foundObject.downloadCount++;
    }

    localStorage.setItem('globalFolders', JSON.stringify([...globalFolders]));
    homeDispatch({ field: 'globalFolders', value: [...globalFolders] });

    const currentFolderPrompts = globalPrompts.filter(
      (prompt) => prompt.folderId == currentFolder.id,
    );
    // The property you want to remove
    const propertyToRemove = 'downloadCount';

    // Create a new array with the property removed from each object
    const newArray = currentFolderPrompts.map((obj) => {
      // Destructure the object and create a new one without the specified property
      const { [propertyToRemove]: _, ...newObj } = obj;
      return newObj;
    });
    localStorage.setItem('prompts', JSON.stringify([...prompts, ...newArray]));

    homeDispatch({ field: 'prompts', value: [...prompts, ...newArray] });

    localStorage.setItem(
      'folders',
      JSON.stringify([
        ...folders,
        {
          id: currentFolder.id,
          name: currentFolder.name,
          type: currentFolder.type,
        },
      ]),
    );
    homeDispatch({
      field: 'folders',
      value: [
        ...folders,
        {
          id: currentFolder.id,
          name: currentFolder.name,
          type: currentFolder.type,
        },
      ],
    });
    alert('Folder downloaded successfully.');
    offGlobal();
    await updatePromptCount(foundObject);
  };
  const deleteGlobalFolder = async (folderId: string) => {
    const updatedFolders = globalFolders.filter((f) => f.id !== folderId);
    homeDispatch({ field: 'globalFolders', value: updatedFolders });
    localStorage.setItem('globalFolders', JSON.stringify(updatedFolders));
    const controller = new AbortController();

    const currentFolderPrompts = globalPrompts.filter(
      (prompt) => prompt.folderId == currentFolder.id,
    );
    const latestGlobalPrompts = globalPrompts.filter(
      (prompt) => prompt.folderId != currentFolder.id,
    );
    localStorage.setItem('globalPrompts', JSON.stringify(latestGlobalPrompts));

    homeDispatch({ field: 'globalPrompts', value: latestGlobalPrompts });
    alert('Folder successfully deleted from marketplace.');
    const response = await fetch('/api/deleteFolder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(currentFolder),
    });
    const controller2 = new AbortController();

    await fetch('/api/deleteFolderPrompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller2.signal,
      body: JSON.stringify(currentFolder),
    });
  };
  return (
    <>
      <div
        className="relative flex items-center"
        style={{ backgroundColor: color.background, color: color.text }}
      >
        {isRenaming ? (
          <div className="flex w-full items-center gap-3  p-3">
            {isOpen ? (
              <IconCaretDown size={18} />
            ) : (
              <IconCaretRight size={18} />
            )}
            <input
              className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-neutral-400 bg-transparent text-left text-[12.5px] leading-3  outline-none focus:border-neutral-100"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleEnterDown}
              autoFocus
            />
          </div>
        ) : (
          <button
            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200`}
            onClick={() => setIsOpen(!isOpen)}
            onDrop={(e) => dropHandler(e)}
            onDragOver={allowDrop}
            onDragEnter={highlightDrop}
            onDragLeave={removeHighlight}
          >
            {isOpen ? (
              <IconCaretDown size={18} />
            ) : (
              <IconCaretRight size={18} />
            )}

            <div
              style={{ color: color.text }}
              className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3"
            >
              {currentFolder.name}
              {isGlobal &&
                currentFolder.type == 'prompt' &&
                `(${(currentFolder as GlobalFolderInterface).downloadCount})`}
            </div>
          </button>
        )}

        {(isDeleting || isRenaming) && (
          <div className="absolute right-1 z-10 flex text-gray-300">
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();

                if (isDeleting) {
                  handleDeleteFolder(currentFolder.id);
                } else if (isRenaming) {
                  handleRename();
                }

                setIsDeleting(false);
                setIsRenaming(false);

                setIsDeleting(false);
              }}
            >
              <IconCheck size={18} />
            </SidebarActionButton>
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
                setIsDeleting(false);
                setIsRenaming(false);
              }}
            >
              <IconX size={18} />
            </SidebarActionButton>
          </div>
        )}

        {!isDeleting && !isRenaming && (
          <div className="absolute right-1 z-10 flex text-gray-300">
            {currentFolder.type == 'chat' && (
              <SidebarActionButton
                handleClick={(e) => {
                  setIsChangeColor((old) => !old);
                  //e.stopPropagation();
                  //setIsRenaming(true);
                  //setRenameValue(currentFolder.name);
                }}
              >
                <IconPalette size={18} />
              </SidebarActionButton>
            )}

            {(currentFolder.type == 'chat' ||
              (currentFolder.type == 'prompt' && !isGlobal)) && (
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setRenameValue(currentFolder.name);
                }}
              >
                <IconPencil size={18} />
              </SidebarActionButton>
            )}
            {(currentFolder.type == 'chat' ||
              (currentFolder.type == 'prompt' && !isGlobal) ||
              (isGlobal &&
                (user as null | { id: string })?.id ==
                  (currentFolder as any).userId)) && (
              <SidebarActionButton
                handleClick={(e) => {
                  let response = confirm(
                    'Are you sure you want to delete folder and all of its content?',
                  );
                  if (response) {
                    e.stopPropagation();
                    //setIsDeleting(true);
                    if (!isGlobal) handleDeleteFolder(currentFolder.id);
                    else {
                      deleteGlobalFolder(currentFolder.id);
                    }
                  }
                }}
              >
                <IconTrash size={18} />
              </SidebarActionButton>
            )}

            {isGlobal && currentFolder.type == 'prompt' && (
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
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
              </SidebarActionButton>
            )}
            {!isGlobal && currentFolder.type == 'prompt' && (
              <SidebarActionButton
                handleClick={(e) => {
                  // e.stopPropagation();
                  // setIsDeleting(true);
                  handleMakeGlobal(e);
                }}
              >
                <IconWorld size={18} />
              </SidebarActionButton>
            )}
          </div>
        )}
      </div>

      {isOpen ? folderComponent : null}
      {isChangeColor && (
        <select
          value={changeWhat}
          onChange={(e) => setChangeWhat(e.target.value)}
          style={{
            backgroundColor: lightMode == 'light' ? 'white' : 'black',
            color: lightMode == 'light' ? 'black' : 'white',
            borderColor: lightMode == 'light' ? 'black' : 'white',
            marginBottom: '10px',
            border: '1px solid',
          }}
          id="optionSelect"
        >
          <option value="background">Change Background Color</option>
          <option value="text">Change Text Color</option>
        </select>
      )}
      {isChangeColor && (
        <TwitterPicker
          colors={ColorCodes}
          onChangeComplete={handleChangeComplete}
          width={'210px'}
        />
      )}
    </>
  );
};

export default Folder;
