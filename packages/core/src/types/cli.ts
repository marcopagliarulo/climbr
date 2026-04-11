export type InquirerChoice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

export type PromptConfirm = {
  message: string;
  defaultValue?: boolean;
};

export type PromptInput = {
  message: string;
  defaultValue?: string;
  required?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type PromptNumber = {
  message: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  required?: boolean;
  defaultValue?: number;
  validate?: (
    value: number | undefined,
  ) => boolean | string | Promise<string | boolean>;
};

export type PromptPassword = {
  message: string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type PromptSearchChoices = {
  message: string;
  choices: InquirerChoice<string>[];
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type PromptSearch<T> = {
  message: string;
  source: (term: string | void) => Promise<InquirerChoice<T>[]>;
  validate?: (value: unknown) => boolean | string | Promise<string | boolean>;
};

export type PromptSelect<T> = {
  message: string;
  defaultValue?: NoInfer<T>;
  choices: InquirerChoice<T>[];
};

export type PromptObject = {
  message: string;
  defaultValue?: string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type PromptArray = {
  message: string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type FormatValue = {
  value: string | number | boolean | object;
  maxLength?: number;
};

export type BoxedMessage = {
  message: string;
  title?: string;
};

export type BoxedMessagePrivate = BoxedMessage & {
  type?: 'info' | 'success' | 'error' | 'warning' | 'debug';
};
