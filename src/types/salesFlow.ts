export type PhoneSource = 'url' | 'manual';

export type Device =
  | 'SMART_TV'
  | 'TV_BOX_FIRE_STICK_MI_STICK_PROJETOR'
  | 'CELULAR'
  | 'COMPUTADOR';

export type SelectedApp =
  | 'HDPLAYER'
  | 'MAXPLAYER'
  | 'CLOUDDY'
  | 'BLESSED_PLAYER'
  | 'UHD_ULTRA_PLAYER';

export type StepType =
  | 'phone'
  | 'phone-confirm'
  | 'device-options'
  | 'options'
  | 'instructions'
  | 'ready'
  | 'support'
  | 'placeholder';

export interface SalesFlowAnswer {
  step: string;
  answer: string;
  answeredAt: string;
}

export interface TrialCreationResult {
  status: 'idle' | 'success' | 'error';
  message?: string;
  username?: string;
  password?: string;
  createdAt?: string;
}

export interface SalesFlowData {
  phone: string;
  phoneSource: PhoneSource | null;
  device: Device | null;
  hasPlayStore: boolean | null;
  hasDownloader: boolean | null;
  hasNtDown: boolean | null;
  selectedApp: SelectedApp | null;
  currentStep: string;
  history: string[];
  answers: SalesFlowAnswer[];
  trial: TrialCreationResult;
}

export interface FlowOptionMutation {
  phone?: string;
  phoneSource?: PhoneSource;
  device?: Device | null;
  hasPlayStore?: boolean | null;
  hasDownloader?: boolean | null;
  hasNtDown?: boolean | null;
  selectedApp?: SelectedApp | null;
}

export interface FlowOption {
  id: string;
  label: string;
  value: string;
  nextStep: string;
  description?: string;
  icon?: string;
  mutation?: FlowOptionMutation;
  clearDeviceSpecific?: boolean;
  external?: 'support';
}

export interface FlowStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  eyebrow?: string;
  options?: FlowOption[];
  appToPrepare?: SelectedApp;
}

export type FlowStatus = 'IN_PROGRESS' | 'READY_TO_CREATE_TRIAL';

export interface FlowPayload {
  phone: string;
  device: Device | null;
  selectedApp: SelectedApp | null;
  answers: SalesFlowAnswer[];
  status: FlowStatus;
}

export interface BestPanelTrialRequest {
  type: string | null;
  email: string | null;
  notes: string | null;
  phone: string;
  password: string;
  username: string;
  plan_value: number | null;
  package_id: string | number;
}

export interface BestPanelTrialResponse {
  ok: boolean;
  message: string;
  username?: string;
  password?: string;
  raw?: unknown;
}
