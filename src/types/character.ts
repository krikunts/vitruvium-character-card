export interface MainInfo {
  name: string;
  attributes: { [key: string]: number };
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  level: number;
}

export interface ExportSkill {
  name: string;
  description: string;
  level: number;
}

export interface SkillCategory {
  id: number;
  name: string;
  skills: Skill[];
}

export interface ExportSkillCategory {
  name: string;
  skills: ExportSkill[];
}

export interface Styles {
  theme: string;
  customStyles: { [key: string]: string };
}

export interface CharacterData {
  mainInfo: MainInfo;
  styles: Styles;
  skillCategories: SkillCategory[];
}

export interface ExportCharacterData {
  mainInfo: MainInfo;
  styles: Styles;
  skillCategories: ExportSkillCategory[];
}

export interface CharacterState {
  skillCategories: SkillCategory[];
  nextCategoryId: number;
  nextSkillId: number;
  currentPageIndex: number;
  mainInfo: MainInfo;
}

export interface ThemeState {
  theme: string;
  customStyles: { [key: string]: string };
}

