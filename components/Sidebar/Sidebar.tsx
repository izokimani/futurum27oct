import {
  IconAdjustments,
  IconAdjustmentsOff,
  IconFileImport,
  IconFolderPlus,
  IconMistOff,
  IconPlus,
  IconWorld,
} from '@tabler/icons-react';
import { ReactNode, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css';

import Image from 'next/image';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { importData } from '@/utils/app/importExport';

import { LatestExportFormat, SupportedExportFormats } from '@/types/export';

import HomeContext from '@/pages/api/home/home.context';

import TemplatesData from '../../components/TemplatesData';
import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton';

import PromptbarContext from '../Promptbar/PromptBar.context';
import {
  PromptbarInitialState,
  initialState,
} from '../Promptbar/Promptbar.state';
import Search from '../Search';

import { AuthContext } from '@/contexts/authContext';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  globalItems: T[];
  itemComponent: ReactNode;
  globalItemComponent: ReactNode;
  globalFolderComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
  handleFilter: (searchTerm: string, option: string) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  globalItems,
  itemComponent,
  globalItemComponent,
  globalFolderComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  handleFilter,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const {
    state: {
      apiKey,
      lightMode,
      globalPrompts,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      isGlobal,
    },
    dispatch: homeDispatch,
    onGlobal,
    offGlobal,
    onPluginSelect,
    offPluginSelect,
  } = useContext(HomeContext);

  const promptBarContextValue = useCreateReducer<PromptbarInitialState>({
    initialState,
  });
  const {
    state: { filteredPrompts, filteredGlobalPrompts },
    dispatch: promptDispatch,
  } = promptBarContextValue;
  const [showBox, setShowBox] = useState(false);
  // const [isGlobal,setIsGlobal]=useState(false)
  const { user, login, userRole } = useContext(AuthContext);
  const [fileJson, setFileJson] = useState<SupportedExportFormats | undefined>(
    undefined,
  );
  const [selectionValue, setSelectionValue] = useState('');
  const [isPromptModal, setIsPromptModal] = useState(false);
  const [marketPlace, setMarketPlace] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [fileValue, setFileValue] = useState<File | null>(null);
  //awais
  const [filterValue, setFilterValue] = useState(''); // State for the input value
  const [selectedOption, setSelectedOption] = useState('most downloaded'); // State for the selected radio option4
  const [removeFilter, setRemoveFilter] = useState(false); // State for the selected radio option4
  const { t } = useTranslation('promptbar');

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };
  const handleImportConversations = (
    data: SupportedExportFormats | undefined,
  ) => {
    if (data == undefined) return;

    const { history, folders, prompts }: LatestExportFormat = importData(data);
    homeDispatch({ field: 'conversations', value: history });
    homeDispatch({
      field: 'selectedConversation',
      value: history[history.length - 1],
    });
    homeDispatch({ field: 'folders', value: folders });
    homeDispatch({ field: 'prompts', value: prompts });

    window.location.reload();
  };
  const handleSelection = (value: any) => {
    setSelectionValue(value);
    const file = require(`/public/templates/${value}.json`);
    setFileJson(file);
    // handleImportConversations(file)
  };

  //awais

  const handleInputChange = (e: any) => {
    setFilterValue(e.target.value);
  };

  const handleRadioChange = (e: any) => {
    setSelectedOption(e.target.value);
  };

  const handleAddFilter = () => {
    // if (filterValue.trim() === '') {
    //   // Input is empty, show an error or return early
    //   console.error('Input is empty. Please enter a value.');
    //   return;
    // }

    // if (!selectedOption) {
    //   // No radio option is selected, show an error or return early
    //   console.error('Please select a radio option.');
    //   return;
    // }

    handleFilter(filterValue, selectedOption);
    setRemoveFilter(true);
    setShowFilterMenu(false);
    setFilterValue('');
    setSelectedOption('most downloaded');
  };

  return user && isOpen ? (
    <div>
      {showBox && (
        <div
          style={{ height: '800px' }}
          className="z-100 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              />

              <div
                style={{
                  backgroundColor: lightMode == 'light' ? 'white' : 'black',
                  color: lightMode == 'light' ? 'black' : 'white',
                  height: '400px',
                }}
                className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
              >
                <div className="mb-4 text-1xl">
                  Please import template from your PC or choose from list
                </div>
                <input
                  style={{ marginBottom: '20px' }}
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (!e.target.files?.length) return;
                    setSelectionValue('');

                    const file = e.target.files[0];
                    setFileValue(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      let json = JSON.parse(e.target?.result as string);
                      // handleImportConversations(json);
                      setFileJson(json);
                    };
                    reader.readAsText(file);
                  }}
                />
                <SelectSearch
                  className="select-search"
                  options={TemplatesData.map((pokemon) => ({
                    value: pokemon,
                    name: pokemon.replace(/_/g, ' '),
                  }))}
                  search
                  placeholder="Click to select templates..."
                  onChange={(value) => handleSelection(value)}
                />
                <p style={{ padding: '20px' }}>
                  {selectionValue.length > 0 && `${selectionValue}.json`}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    handleImportConversations(fileJson);
                    setShowBox(false);
                  }}
                  className="mt-6 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                >
                  {t('Import')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBox(false);
                  }}
                  className="mt-6 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                >
                  {t('Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          backgroundColor: lightMode == 'light' ? 'white' : 'black',
          color: lightMode == 'light' ? 'black' : 'white',
          borderColor: lightMode == 'light' ? 'black' : 'white',
        }}
        className={`fixed top-0 ${side}-0 z-40 flex h-full w-[260px] flex-none flex-col space-y-2 bg-[#202123] p-2 text-[14px] transition-all sm:relative sm:top-0`}
      >
        <div className="flex items-center">
          <input
            id="import-file"
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (!e.target.files?.length) return;

              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = (e) => {
                let json = JSON.parse(e.target?.result as string);
                handleImportConversations(json);
              };
              reader.readAsText(file);
            }}
          />
          {side == 'right' ? (
            <button
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
                display: 'flex',
                justifyContent: 'space-around',
                width: '99%',
              }}
              className="text-sidebar flex flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md  border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
              // onClick={() => {
              //   handleCreateItem();
              //   handleSearchTerm('');
              // }}
            >
              {side == 'right' && (
                <div className="group relative">
                  <Image
                    width={25}
                    onClick={() => (isGlobal ? offGlobal() : onGlobal())}
                    style={{ background: 'transparent' }}
                    height={25}
                    src={'/shopping_cart.png'}
                    alt="cart"
                  />
                  <span
                    style={{ width: 'max-content' }}
                    className="absolute top-5 scale-0 transition-all rounded bg-gray-800 p-2  text-white group-hover:scale-100"
                  >
                    Marketplace
                  </span>
                </div>
              )}
              {side == 'right' && (
                <div className="group relative">
                  <Image
                    width={20}
                    onClick={() => setShowBox(true)}
                    style={{ background: 'transparent' }}
                    height={20}
                    src={'/import_icon.png'}
                    alt="import icon"
                  />                  {/* <IconFileImport
                    onClick={() => {
                      setShowBox(true);
                      // const importFile = document.querySelector(
                      //   '#import-file',
                      // ) as HTMLInputElement;
                      // if (importFile) {
                      //   importFile.click();
                      // }
                    }}
                    size={18}
                  /> */}
                  <span
                    style={{ width: 'max-content' }}
                    className="absolute top-5 scale-0 transition-all rounded bg-gray-800 p-2  text-white group-hover:scale-100"
                  >
                    Import Template
                  </span>
                </div>
              )}
              <div className="group relative">
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                  onClick={() => {
                    handleCreateItem();
                    handleSearchTerm('');
                  }}
                >
                  {/* <IconPlus size={16} /> */}
                  <Image
                    width={20}
                    style={{ background: 'transparent' }}
                    height={20}
                    src={'/new_template_prompt.png'}
                    alt="new template prompt"
                  />    
                  {/* {addItemButtonTitle} */}
                </button>
                <span
                  style={{ width: 'max-content' }}
                  className="absolute top-5 right-(-1) scale-0 transition-all rounded bg-gray-800 p-2  text-white group-hover:scale-100"
                >
                  New Prompt
                </span>
              </div>
              {side == 'right' && (
                <div className="group relative">
                  <button
                    style={{
                      color: lightMode === 'dark' ? 'white' : 'black',
                    }}
                    className=" flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md   text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
                    onClick={handleCreateFolder}
                  >
                  <Image
                    width={20}
                    style={{ background: 'transparent' }}
                    height={20}
                    src={'/add_folder.png'}
                    alt="add folder"
                  />   
                    {/* <IconFolderPlus size={16} /> */}
                  </button>
                  <span
                    style={{ width: 'max-content' }}
                    className="absolute top-5 z-[100] right-1 scale-0 transition-all rounded bg-gray-800 p-2  text-white group-hover:scale-100"
                  >
                    New Folder
                  </span>
                </div>
              )}
            </button>
          ) : (
            <button
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
              }}
              className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
              onClick={() => {
                handleCreateItem();
                handleSearchTerm('');
              }}
            >
              <IconPlus size={16} />
              {addItemButtonTitle}
            </button>
          )}

          {side == 'left' && (
            <div className="group relative">
              <button
                style={{
                  color: lightMode === 'dark' ? 'white' : 'black',
                }}
                className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md  p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
                onClick={handleCreateFolder}
              >
                {/* <IconFolderPlus size={16} /> */}
               <Image
                    width={20}
                    style={{ background: 'transparent' }}
                    height={20}
                    src={'/add_folder.png'}
                    alt="add folder"
                  />   
              </button>
              <span
                style={{ width: 'max-content' }}
                className="absolute top-8 z-[100] right-3 scale-0 transition-all rounded bg-gray-800 p-2  text-white group-hover:scale-100"
              >
                New Folder
              </span>
            </div>
          )}
        </div>
        {side === 'right' ? (
          isGlobal ? (
            <p>Marketplace</p>
          ) : (
            <p>My Templates</p>
          )
        ) : null}
        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
          lightMode={lightMode}
        />
        {/* {side === 'right' && isGlobal ? (
          <div className="p-1 flex justify-between">
            <div>
              <div className="relative">
                <div
                  style={{
                    position: 'absolute',
                    right: '-225px',
                  }}
                >
                  {!removeFilter ? (
                    <IconAdjustments
                      className="cursor-pointer"
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                    />
                  ) : (
                    <IconAdjustmentsOff
                      className="cursor-pointer"
                      onClick={() => {
                        handleSearchTerm('');
                        setRemoveFilter(false);
                        handleFilter('', 'most downloaded');
                      }}
                    />
                  )}
                </div>
                {showFilterMenu && (
                  <div className="bg-gray-300 p-4 rounded-lg shadow-md w-[250px] top-[30px] absolute -right-[225px] z-50">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500">
                        Sort By
                      </label>
                      <div className="mt-1 space-y-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-indigo-600"
                            name="sort"
                            value="most downloaded"
                            checked={selectedOption === 'most downloaded'}
                            onChange={handleRadioChange}
                          />
                          <span className="ml-2">Most Download</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-indigo-600"
                            name="sort"
                            value="created date"
                            checked={selectedOption === 'created date'}
                            onChange={handleRadioChange}
                          />
                          <span className="ml-2">Created Date</span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500">
                        Filter By
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          className="w-full text-black px-3 py-2 border rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Key"
                          value={filterValue}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        style={{
                          backgroundColor:
                            lightMode === 'dark' ? 'black' : 'white',
                          color: lightMode === 'dark' ? 'white' : 'black',
                        }}
                        className="w-full   font-semibold py-2 rounded-lg  transition duration-300"
                        onClick={handleAddFilter}
                      >
                        Add Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          ''
        )} */}

        <div className="flex-grow overflow-auto">
          {side == 'right' && isGlobal && globalItems?.length > 0 && (
            <div
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
              }}
              className="flex border-b border-white/20 pb-2"
            >
              {folderComponent}
            </div>
          )}
          {(side == 'left' || !isGlobal) && items?.length > 0 && (
            <div
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
              }}
              className="flex border-b border-white/20 pb-2"
            >
              {folderComponent}
            </div>
          )}
          {side == 'right' &&
            isGlobal &&
            (globalItems?.length > 0 ? (
              <div
                className="pt-2"
                onDrop={handleDrop}
                onDragOver={allowDrop}
                onDragEnter={highlightDrop}
                onDragLeave={removeHighlight}
              >
                {globalItemComponent}
              </div>
            ) : (
              <div className="mt-8 select-none text-center text-white opacity-50">
                <IconMistOff
                  color={`${lightMode === 'light' ? 'black' : 'white'}`}
                  className="mx-auto mb-3"
                />
                <span
                  style={{
                    color: lightMode == 'light' ? 'black' : 'white',
                  }}
                  className="text-[14px] leading-normal"
                >
                  {t('No data.')}
                </span>
              </div>
            ))}

          {(side == 'left' || !isGlobal) &&
            (items?.length > 0 ? (
              <div
                className="pt-2"
                onDrop={handleDrop}
                onDragOver={allowDrop}
                onDragEnter={highlightDrop}
                onDragLeave={removeHighlight}
              >
                {itemComponent}
              </div>
            ) : (
              <div className="mt-8 select-none text-center text-white opacity-50">
                <IconMistOff
                  color={`${lightMode === 'light' ? 'black' : 'white'}`}
                  className="mx-auto mb-3"
                />
                <span
                  style={{
                    color: lightMode == 'light' ? 'black' : 'white',
                  }}
                  className="text-[14px] leading-normal"
                >
                  {t('No data.')}
                </span>
              </div>
            ))}
        </div>
        {footerComponent}
      </div>

      <CloseSidebarButton
        handleCreateItem={handleCreateItem}
        onClick={() => {
          toggleOpen();
          offPluginSelect();
        }}
        side={side}
      />
    </div>
  ) : (
    user && (
      <OpenSidebarButton
        handleCreateItem={handleCreateItem}
        onClick={() => {
          toggleOpen();
          offPluginSelect();
        }}
        side={side}
      />
    )
  );
};

export default Sidebar;
