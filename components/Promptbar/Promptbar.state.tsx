import { Prompt } from '@/types/prompt';

export interface PromptbarInitialState {
  searchTerm: string;
  filteredPrompts: Prompt[];
  filteredGlobalPrompts: Prompt[];
  fillerSearchTerm: string;
  filterOption: string;
}

export const initialState: PromptbarInitialState = {
  searchTerm: '',
  filteredPrompts: [],
  filteredGlobalPrompts: [],
  fillerSearchTerm: '',
  filterOption: 'most downloded',
};
