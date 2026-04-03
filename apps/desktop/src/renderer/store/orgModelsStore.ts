import { create } from 'zustand'

export interface OrgRecommendation {
  modelId: string
  modelName: string
  params: string
  arch: string
  description: string
  recommenders: string[]
  endorsements: number
}

export interface OrgTrainedModel {
  modelId: string
  displayName: string
  baseModel: string
  params: string
  arch: string
  trainingRuns: number
  lastTrainedAt: string
  isUniqueToOrg: boolean
}

interface OrgModelsState {
  recommendations: OrgRecommendation[]
  trainedModels: OrgTrainedModel[]
}

// Mock data — in production these would be synced from the local org intelligence service
const ORG_RECOMMENDATIONS: OrgRecommendation[] = [
  {
    modelId: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    modelName: 'Qwen 2.5 Coder 7B',
    params: '7B',
    arch: 'qwen2',
    description: 'Endorsed by the dev team for code review and generation tasks',
    recommenders: ['Alice Chen', 'Bob Li', 'Carol Zhao'],
    endorsements: 4,
  },
  {
    modelId: 'microsoft/Phi-3.5-mini-instruct',
    modelName: 'Phi-3.5 Mini Instruct',
    params: '3.8B',
    arch: 'phi3',
    description: 'Lightweight choice for CI/CD integration — fast and memory-efficient',
    recommenders: ['Eve Zhang', 'Frank Wang', 'Grace Liu'],
    endorsements: 3,
  },
  {
    modelId: 'meta-llama/Llama-3.1-8B-Instruct',
    modelName: 'Llama 3.1 8B Instruct',
    params: '8B',
    arch: 'llama',
    description: 'Go-to model for chat, documentation generation and code explanation',
    recommenders: ['David Wu'],
    endorsements: 1,
  },
]

const ORG_TRAINED_MODELS: OrgTrainedModel[] = [
  {
    modelId: 'sovereign-qwen-coder-v3',
    displayName: 'Sovereign-QwenCoder-v3',
    baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    params: '7B',
    arch: 'qwen2',
    trainingRuns: 12,
    lastTrainedAt: '2026-03-28T14:22:00Z',
    isUniqueToOrg: true,
  },
  {
    modelId: 'dev-team-llama-8b',
    displayName: 'DevTeam-Llama-8B',
    baseModel: 'meta-llama/Llama-3.1-8B-Instruct',
    params: '8B',
    arch: 'llama',
    trainingRuns: 7,
    lastTrainedAt: '2026-03-15T09:10:00Z',
    isUniqueToOrg: true,
  },
  {
    modelId: 'qa-mistral-7b',
    displayName: 'QA-Mistral-7B',
    baseModel: 'mistralai/Mistral-7B-Instruct-v0.3',
    params: '7B',
    arch: 'mistral',
    trainingRuns: 3,
    lastTrainedAt: '2026-02-10T11:30:00Z',
    isUniqueToOrg: false,
  },
]

export const useOrgModelsStore = create<OrgModelsState>(() => ({
  recommendations: ORG_RECOMMENDATIONS,
  trainedModels: ORG_TRAINED_MODELS,
}))
