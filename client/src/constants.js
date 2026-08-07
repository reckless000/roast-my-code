export const MAX_CODE_LENGTH = 20000;
export const MIN_CODE_LENGTH = 10;

export const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect (whatever, we\'ll see)' },
  { value: 'javascript', label: 'JavaScript / TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML / CSS' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C / C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'other', label: 'Other / I don\'t know' },
];

export const ROAST_ACCENTS = [
  { value: '', label: 'No filter — English' },
  { value: 'egyptian-arabic', label: 'Egyptian Arabic (مصري)' },
  { value: 'gulf-arabic', label: 'Gulf Arabic (خليجي)' },
  { value: 'levantine-arabic', label: 'Levantine Arabic (شامي)' },
  { value: 'moroccan-arabic', label: 'Moroccan Darija (داريجة)' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'pidgin', label: 'Nigerian Pidgin' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'aussie', label: 'Australian' },
];

export const LOADING_PHRASES = [
  'Reading your code out loud, slowly...',
  'Scanning for crimes against DRY...',
  'Judging your variable names...',
  'Counting the ways this could break...',
  'Consulting the senior dev council...',
  'Preparing the burn...',
  'Opening your PR in Slack...',
  'Finding the exact line to be mean about...',
];
