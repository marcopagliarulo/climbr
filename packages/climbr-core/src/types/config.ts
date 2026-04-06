export type ConfigValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum';

export interface ConfigDefinition {
  type: ConfigValueType;
  description: string;
  default?: string | number | boolean | object;
  required?: boolean;
  options?: string[];
  validate?: (value: string | number | boolean | object) => boolean | string;
}

export interface ConfigDefinitionSet {
  [key: string]: ConfigDefinition;
}

export interface ConfigSchema {
  commands: {
    [key: string]: ConfigDefinitionSet;
  };
}
