/**
 * HuggingFace model filter data — mirrors the filter panel at huggingface.co/models
 * Tasks, Libraries, Languages, Licenses, and Other tags.
 */

// ─── Active filter state shape (shared across hooks and components) ──────────

export interface HFActiveFilters {
  task?: string
  library?: string
  language?: string
  license?: string
  other?: string
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface HFTask {
  id: string        // pipeline_tag value sent to HF API
  label: string     // display text
  category: string  // grouping header
}

export const HF_TASK_CATEGORIES = [
  'Multimodal',
  'Computer Vision',
  'Natural Language Processing',
  'Audio',
  'Tabular',
] as const

export type HFTaskCategory = (typeof HF_TASK_CATEGORIES)[number]

export const HF_TASKS: HFTask[] = [
  // ── Multimodal ──────────────────────────────────────────────────────────
  { id: 'audio-text-to-text',         label: 'Audio-Text-to-Text',          category: 'Multimodal' },
  { id: 'image-text-to-text',         label: 'Image-Text-to-Text',          category: 'Multimodal' },
  { id: 'image-text-to-image',        label: 'Image-Text-to-Image',         category: 'Multimodal' },
  { id: 'image-text-to-video',        label: 'Image-Text-to-Video',         category: 'Multimodal' },
  { id: 'visual-question-answering',  label: 'Visual Question Answering',   category: 'Multimodal' },
  { id: 'document-question-answering',label: 'Document Question Answering', category: 'Multimodal' },
  { id: 'video-text-to-text',         label: 'Video-Text-to-Text',          category: 'Multimodal' },
  { id: 'visual-document-retrieval',  label: 'Visual Document Retrieval',   category: 'Multimodal' },
  { id: 'any-to-any',                 label: 'Any-to-Any',                  category: 'Multimodal' },
  // ── Computer Vision ─────────────────────────────────────────────────────
  { id: 'depth-estimation',              label: 'Depth Estimation',              category: 'Computer Vision' },
  { id: 'image-classification',          label: 'Image Classification',          category: 'Computer Vision' },
  { id: 'object-detection',              label: 'Object Detection',              category: 'Computer Vision' },
  { id: 'image-segmentation',            label: 'Image Segmentation',            category: 'Computer Vision' },
  { id: 'text-to-image',                 label: 'Text-to-Image',                 category: 'Computer Vision' },
  { id: 'image-to-text',                 label: 'Image-to-Text',                 category: 'Computer Vision' },
  { id: 'image-to-image',                label: 'Image-to-Image',                category: 'Computer Vision' },
  { id: 'image-to-video',                label: 'Image-to-Video',                category: 'Computer Vision' },
  { id: 'unconditional-image-generation',label: 'Unconditional Image Generation',category: 'Computer Vision' },
  { id: 'video-classification',          label: 'Video Classification',          category: 'Computer Vision' },
  { id: 'text-to-video',                 label: 'Text-to-Video',                 category: 'Computer Vision' },
  { id: 'zero-shot-image-classification',label: 'Zero-Shot Image Classification',category: 'Computer Vision' },
  { id: 'mask-generation',               label: 'Mask Generation',               category: 'Computer Vision' },
  { id: 'zero-shot-object-detection',    label: 'Zero-Shot Object Detection',    category: 'Computer Vision' },
  { id: 'text-to-3d',                    label: 'Text-to-3D',                    category: 'Computer Vision' },
  { id: 'image-to-3d',                   label: 'Image-to-3D',                   category: 'Computer Vision' },
  { id: 'image-feature-extraction',      label: 'Image Feature Extraction',      category: 'Computer Vision' },
  { id: 'keypoint-detection',            label: 'Keypoint Detection',            category: 'Computer Vision' },
  { id: 'video-to-video',                label: 'Video-to-Video',                category: 'Computer Vision' },
  // ── Natural Language Processing ─────────────────────────────────────────
  { id: 'text-classification',    label: 'Text Classification',    category: 'Natural Language Processing' },
  { id: 'token-classification',   label: 'Token Classification',   category: 'Natural Language Processing' },
  { id: 'table-question-answering',label: 'Table Question Answering',category: 'Natural Language Processing' },
  { id: 'question-answering',     label: 'Question Answering',     category: 'Natural Language Processing' },
  { id: 'zero-shot-classification',label: 'Zero-Shot Classification',category: 'Natural Language Processing' },
  { id: 'translation',            label: 'Translation',            category: 'Natural Language Processing' },
  { id: 'summarization',          label: 'Summarization',          category: 'Natural Language Processing' },
  { id: 'feature-extraction',     label: 'Feature Extraction',     category: 'Natural Language Processing' },
  { id: 'text-generation',        label: 'Text Generation',        category: 'Natural Language Processing' },
  { id: 'fill-mask',              label: 'Fill-Mask',              category: 'Natural Language Processing' },
  { id: 'sentence-similarity',    label: 'Sentence Similarity',    category: 'Natural Language Processing' },
  { id: 'text-ranking',           label: 'Text Ranking',           category: 'Natural Language Processing' },
  // ── Audio ────────────────────────────────────────────────────────────────
  { id: 'text-to-speech',              label: 'Text-to-Speech',              category: 'Audio' },
  { id: 'text-to-audio',               label: 'Text-to-Audio',               category: 'Audio' },
  { id: 'automatic-speech-recognition',label: 'Automatic Speech Recognition',category: 'Audio' },
  { id: 'audio-to-audio',              label: 'Audio-to-Audio',              category: 'Audio' },
  { id: 'audio-classification',        label: 'Audio Classification',        category: 'Audio' },
  { id: 'voice-activity-detection',    label: 'Voice Activity Detection',    category: 'Audio' },
  // ── Tabular ──────────────────────────────────────────────────────────────
  { id: 'tabular-classification', label: 'Tabular Classification', category: 'Tabular' },
  { id: 'tabular-regression',     label: 'Tabular Regression',     category: 'Tabular' },
  { id: 'time-series-forecasting',label: 'Time Series Forecasting',category: 'Tabular' },
]

// ─── Libraries ───────────────────────────────────────────────────────────────

export interface HFLibrary {
  id: string    // value sent to HF API as `library` param
  label: string
}

export const HF_LIBRARIES: HFLibrary[] = [
  { id: 'pytorch',             label: 'PyTorch' },
  { id: 'tensorflow',          label: 'TensorFlow' },
  { id: 'jax',                 label: 'JAX' },
  { id: 'safetensors',         label: 'Safetensors' },
  { id: 'transformers',        label: 'Transformers' },
  { id: 'peft',                label: 'PEFT' },
  { id: 'tensorboard',         label: 'TensorBoard' },
  { id: 'gguf',                label: 'GGUF' },
  { id: 'diffusers',           label: 'Diffusers' },
  { id: 'onnx',                label: 'ONNX' },
  { id: 'stable-baselines3',   label: 'stable-baselines3' },
  { id: 'sentence-transformers',label: 'sentence-transformers' },
  { id: 'ml-agents',           label: 'ml-agents' },
  { id: 'mlx',                 label: 'MLX' },
  { id: 'keras',               label: 'Keras' },
  { id: 'tf-keras',            label: 'TF-Keras' },
  { id: 'adapters',            label: 'Adapters' },
  { id: 'joblib',              label: 'Joblib' },
  { id: 'transformers-js',     label: 'Transformers.js' },
  { id: 'setfit',              label: 'setfit' },
  { id: 'timm',                label: 'timm' },
  { id: 'sample-factory',      label: 'sample-factory' },
  { id: 'openvino',            label: 'OpenVINO' },
  { id: 'flair',               label: 'Flair' },
  { id: 'fastai',              label: 'fastai' },
  { id: 'coreml',              label: 'Core ML' },
  { id: 'espnet',              label: 'ESPnet' },
  { id: 'nemo',                label: 'NeMo' },
  { id: 'bertopic',            label: 'BERTopic' },
  { id: 'litert',              label: 'LiteRT' },
  { id: 'spacy',               label: 'spaCy' },
  { id: 'fasttext',            label: 'fastText' },
  { id: 'rust',                label: 'Rust' },
  { id: 'open_clip',           label: 'OpenCLIP' },
  { id: 'scikit-learn',        label: 'Scikit-learn' },
  { id: 'keras-hub',           label: 'KerasHub' },
  { id: 'asteroid',            label: 'Asteroid' },
  { id: 'executorch',          label: 'ExecuTorch' },
  { id: 'speechbrain',         label: 'speechbrain' },
  { id: 'allennlp',            label: 'AllenNLP' },
  { id: 'llamafile',           label: 'llamafile' },
  { id: 'fairseq',             label: 'Fairseq' },
  { id: 'paddlepaddle',        label: 'PaddlePaddle' },
  { id: 'paddleocr',           label: 'PaddleOCR' },
  { id: 'stanza',              label: 'Stanza' },
  { id: 'pyannote-audio',      label: 'pyannote.audio' },
  { id: 'habana',              label: 'Habana' },
  { id: 'graphcore',           label: 'Graphcore' },
  { id: 'spanmarker',          label: 'SpanMarker' },
  { id: 'paddlenlp',           label: 'paddlenlp' },
  { id: 'unity-sentis',        label: 'unity-sentis' },
  { id: 'dduf',                label: 'DDUF' },
  { id: 'univa',               label: 'univa' },
]

// ─── Languages ───────────────────────────────────────────────────────────────

export interface HFLanguage {
  id: string    // BCP 47 language code sent to HF API
  label: string
}

export const HF_LANGUAGES: HFLanguage[] = [
  { id: 'en',           label: 'English' },
  { id: 'zh',           label: 'Chinese' },
  { id: 'fr',           label: 'French' },
  { id: 'es',           label: 'Spanish' },
  { id: 'de',           label: 'German' },
  { id: 'ja',           label: 'Japanese' },
  { id: 'ko',           label: 'Korean' },
  { id: 'pt',           label: 'Portuguese' },
  { id: 'it',           label: 'Italian' },
  { id: 'ru',           label: 'Russian' },
  { id: 'hi',           label: 'Hindi' },
  { id: 'ar',           label: 'Arabic' },
  { id: 'th',           label: 'Thai' },
  { id: 'tr',           label: 'Turkish' },
  { id: 'multilingual', label: 'multilingual' },
  { id: 'vi',           label: 'Vietnamese' },
  { id: 'id',           label: 'Indonesian' },
  { id: 'pl',           label: 'Polish' },
  { id: 'nl',           label: 'Dutch' },
  { id: 'ro',           label: 'Romanian' },
  { id: 'sv',           label: 'Swedish' },
  { id: 'uk',           label: 'Ukrainian' },
  { id: 'fa',           label: 'Persian' },
  { id: 'cs',           label: 'Czech' },
  { id: 'fi',           label: 'Finnish' },
  { id: 'bn',           label: 'Bengali' },
  { id: 'ne',           label: 'Nepali' },
  { id: 'el',           label: 'Greek' },
  { id: 'da',           label: 'Danish' },
  { id: 'he',           label: 'Hebrew' },
  { id: 'ms',           label: 'Malay' },
  { id: 'ta',           label: 'Tamil' },
  { id: 'hu',           label: 'Hungarian' },
  { id: 'ur',           label: 'Urdu' },
  { id: 'bg',           label: 'Bulgarian' },
  { id: 'ca',           label: 'Catalan' },
  { id: 'te',           label: 'Telugu' },
  { id: 'sw',           label: 'Swahili' },
  { id: 'mr',           label: 'Marathi' },
  { id: 'no',           label: 'Norwegian' },
  { id: 'sr',           label: 'Serbian' },
  { id: 'sk',           label: 'Slovak' },
  { id: 'gu',           label: 'Gujarati' },
  { id: 'sl',           label: 'Slovenian' },
  { id: 'et',           label: 'Estonian' },
  { id: 'my',           label: 'Burmese' },
  { id: 'ml',           label: 'Malayalam' },
  { id: 'hr',           label: 'Croatian' },
  { id: 'lt',           label: 'Lithuanian' },
  { id: 'gl',           label: 'Galician' },
  { id: 'tl',           label: 'Tagalog' },
  { id: 'lv',           label: 'Latvian' },
  { id: 'kn',           label: 'Kannada' },
  { id: 'is',           label: 'Icelandic' },
  { id: 'km',           label: 'Khmer' },
  { id: 'pa',           label: 'Panjabi' },
  { id: 'eu',           label: 'Basque' },
  { id: 'am',           label: 'Amharic' },
  { id: 'af',           label: 'Afrikaans' },
  { id: 'kk',           label: 'Kazakh' },
  { id: 'lo',           label: 'Lao' },
  { id: 'ka',           label: 'Georgian' },
  { id: 'mn',           label: 'Mongolian' },
  { id: 'ha',           label: 'Hausa' },
  { id: 'hy',           label: 'Armenian' },
  { id: 'cy',           label: 'Welsh' },
  { id: 'as',           label: 'Assamese' },
  { id: 'si',           label: 'Sinhala' },
  { id: 'be',           label: 'Belarusian' },
  { id: 'mk',           label: 'Macedonian' },
  { id: 'az',           label: 'Azerbaijani' },
  { id: 'yo',           label: 'Yoruba' },
  { id: 'ga',           label: 'Irish' },
  { id: 'uz',           label: 'Uzbek' },
  { id: 'jv',           label: 'Javanese' },
  { id: 'sq',           label: 'Albanian' },
  { id: 'su',           label: 'Sundanese' },
  { id: 'la',           label: 'Latin' },
  { id: 'bs',           label: 'Bosnian' },
  { id: 'sa',           label: 'Sanskrit' },
  { id: 'so',           label: 'Somali' },
  { id: 'sd',           label: 'Sindhi' },
  { id: 'mt',           label: 'Maltese' },
  { id: 'ps',           label: 'Pashto' },
  { id: 'or',           label: 'Oriya' },
  { id: 'mg',           label: 'Malagasy' },
  { id: 'code',         label: 'code' },
  { id: 'xh',           label: 'Xhosa' },
]

// ─── Licenses ────────────────────────────────────────────────────────────────

export interface HFLicense {
  id: string
  label: string
}

export const HF_LICENSES: HFLicense[] = [
  { id: 'apache-2.0',                         label: 'apache-2.0' },
  { id: 'mit',                                label: 'mit' },
  { id: 'other',                              label: 'other' },
  { id: 'openrail',                           label: 'openrail' },
  { id: 'creativeml-openrail-m',              label: 'creativeml-openrail-m' },
  { id: 'cc-by-nc-4.0',                       label: 'cc-by-nc-4.0' },
  { id: 'llama3',                             label: 'llama3' },
  { id: 'gemma',                              label: 'gemma' },
  { id: 'openrail++',                         label: 'openrail++' },
  { id: 'llama2',                             label: 'llama2' },
  { id: 'cc-by-4.0',                          label: 'cc-by-4.0' },
  { id: 'llama3.1',                           label: 'llama3.1' },
  { id: 'llama3.2',                           label: 'llama3.2' },
  { id: 'cc-by-nc-sa-4.0',                    label: 'cc-by-nc-sa-4.0' },
  { id: 'afl-3.0',                            label: 'afl-3.0' },
  { id: 'cc-by-sa-4.0',                       label: 'cc-by-sa-4.0' },
  { id: 'gpl-3.0',                            label: 'gpl-3.0' },
  { id: 'bigscience-bloom-rail-1.0',          label: 'bigscience-bloom-rail-1.0' },
  { id: 'bigscience-openrail-m',              label: 'bigscience-openrail-m' },
  { id: 'artistic-2.0',                       label: 'artistic-2.0' },
  { id: 'llama3.3',                           label: 'llama3.3' },
  { id: 'bigcode-openrail-m',                 label: 'bigcode-openrail-m' },
  { id: 'cc',                                 label: 'cc' },
  { id: 'bsd-3-clause',                       label: 'bsd-3-clause' },
  { id: 'cc-by-nc-nd-4.0',                    label: 'cc-by-nc-nd-4.0' },
  { id: 'agpl-3.0',                           label: 'agpl-3.0' },
  { id: 'cc0-1.0',                            label: 'cc0-1.0' },
  { id: 'wtfpl',                              label: 'wtfpl' },
  { id: 'unlicense',                          label: 'unlicense' },
  { id: 'bsl-1.0',                            label: 'bsl-1.0' },
  { id: 'bsd',                                label: 'bsd' },
  { id: 'bsd-2-clause',                       label: 'bsd-2-clause' },
  { id: 'gpl',                                label: 'gpl' },
  { id: 'llama4',                             label: 'llama4' },
  { id: 'c-uda',                              label: 'c-uda' },
  { id: 'cc-by-sa-3.0',                       label: 'cc-by-sa-3.0' },
  { id: 'bsd-3-clause-clear',                 label: 'bsd-3-clause-clear' },
  { id: 'cc-by-2.0',                          label: 'cc-by-2.0' },
  { id: 'cc-by-nc-2.0',                       label: 'cc-by-nc-2.0' },
  { id: 'cdla-permissive-2.0',                label: 'cdla-permissive-2.0' },
  { id: 'cc-by-3.0',                          label: 'cc-by-3.0' },
  { id: 'cc-by-nd-4.0',                       label: 'cc-by-nd-4.0' },
  { id: 'gpl-2.0',                            label: 'gpl-2.0' },
  { id: 'cc-by-nc-3.0',                       label: 'cc-by-nc-3.0' },
  { id: 'cc-by-2.5',                          label: 'cc-by-2.5' },
  { id: 'lgpl-3.0',                           label: 'lgpl-3.0' },
  { id: 'apple-amlr',                         label: 'apple-amlr' },
  { id: 'osl-3.0',                            label: 'osl-3.0' },
  { id: 'cc-by-nc-nd-3.0',                    label: 'cc-by-nc-nd-3.0' },
  { id: 'mpl-2.0',                            label: 'mpl-2.0' },
  { id: 'gfdl',                               label: 'gfdl' },
  { id: 'cc-by-nc-sa-2.0',                    label: 'cc-by-nc-sa-2.0' },
  { id: 'pddl',                               label: 'pddl' },
  { id: 'ecl-2.0',                            label: 'ecl-2.0' },
  { id: 'ms-pl',                              label: 'ms-pl' },
  { id: 'cc-by-nc-sa-3.0',                    label: 'cc-by-nc-sa-3.0' },
  { id: 'apple-ascl',                         label: 'apple-ascl' },
  { id: 'fair-noncommercial-research-license',label: 'fair-noncommercial-research-license' },
  { id: 'deepfloyd-if-license',               label: 'deepfloyd-if-license' },
  { id: 'etalab-2.0',                         label: 'etalab-2.0' },
  { id: 'epl-2.0',                            label: 'epl-2.0' },
  { id: 'cdla-sharing-1.0',                   label: 'cdla-sharing-1.0' },
  { id: 'odc-by',                             label: 'odc-by' },
  { id: 'cdla-permissive-1.0',                label: 'cdla-permissive-1.0' },
  { id: 'lgpl',                               label: 'lgpl' },
  { id: 'eupl-1.2',                           label: 'eupl-1.2' },
  { id: 'eupl-1.1',                           label: 'eupl-1.1' },
  { id: 'grok2-community',                    label: 'grok2-community' },
  { id: 'odbl',                               label: 'odbl' },
  { id: 'zlib',                               label: 'zlib' },
  { id: 'lppl-1.3c',                          label: 'lppl-1.3c' },
  { id: 'epl-1.0',                            label: 'epl-1.0' },
  { id: 'lgpl-2.1',                           label: 'lgpl-2.1' },
  { id: 'isc',                                label: 'isc' },
  { id: 'ncsa',                               label: 'ncsa' },
  { id: 'openmdw-1.0',                        label: 'openmdw-1.0' },
  { id: 'lgpl-lr',                            label: 'lgpl-lr' },
  { id: 'intel-research',                     label: 'intel-research' },
  { id: 'h-research',                         label: 'h-research' },
  { id: 'postgresql',                         label: 'postgresql' },
  { id: 'ofl-1.1',                            label: 'ofl-1.1' },
  { id: 'open-mdw',                           label: 'open-mdw' },
]

// ─── Other tags ───────────────────────────────────────────────────────────────

export type HFOtherSection = 'Apps' | 'Inference Providers' | 'Misc'

export interface HFOtherTag {
  id: string
  label: string
  section: HFOtherSection
}

export const HF_OTHER_TAGS: HFOtherTag[] = [
  // Apps
  { id: 'llama-cpp',             label: 'llama.cpp',            section: 'Apps' },
  { id: 'lm-studio',             label: 'LM Studio',            section: 'Apps' },
  { id: 'jan',                   label: 'Jan',                  section: 'Apps' },
  { id: 'draw-things',           label: 'Draw Things',          section: 'Apps' },
  { id: 'diffusionbee',          label: 'DiffusionBee',         section: 'Apps' },
  { id: 'joyfusion',             label: 'JoyFusion',            section: 'Apps' },
  { id: 'vllm',                  label: 'vLLM',                 section: 'Apps' },
  { id: 'ollama',                label: 'Ollama',               section: 'Apps' },
  { id: 'mlx-lm',                label: 'MLX LM',               section: 'Apps' },
  { id: 'docker-model-runner',   label: 'Docker Model Runner',  section: 'Apps' },
  { id: 'lemonade',              label: 'Lemonade',             section: 'Apps' },
  { id: 'sglang',                label: 'SGLang',               section: 'Apps' },
  { id: 'unsloth',               label: 'Unsloth',              section: 'Apps' },
  { id: 'pi',                    label: 'Pi',                   section: 'Apps' },
  // Inference Providers
  { id: 'groq',                  label: 'Groq',                 section: 'Inference Providers' },
  { id: 'novita',                label: 'Novita',               section: 'Inference Providers' },
  { id: 'cerebras',              label: 'Cerebras',             section: 'Inference Providers' },
  { id: 'sambanova',             label: 'SambaNova',            section: 'Inference Providers' },
  { id: 'nscale',                label: 'Nscale',               section: 'Inference Providers' },
  { id: 'fal',                   label: 'fal',                  section: 'Inference Providers' },
  { id: 'hyperbolic',            label: 'Hyperbolic',           section: 'Inference Providers' },
  { id: 'together',              label: 'Together AI',          section: 'Inference Providers' },
  { id: 'fireworks',             label: 'Fireworks',            section: 'Inference Providers' },
  { id: 'featherless-ai',        label: 'Featherless AI',       section: 'Inference Providers' },
  { id: 'zai',                   label: 'Zai',                  section: 'Inference Providers' },
  { id: 'replicate',             label: 'Replicate',            section: 'Inference Providers' },
  { id: 'cohere',                label: 'Cohere',               section: 'Inference Providers' },
  { id: 'scaleway',              label: 'Scaleway',             section: 'Inference Providers' },
  { id: 'public-ai',             label: 'Public AI',            section: 'Inference Providers' },
  { id: 'ovhcloud-ai-endpoints', label: 'OVHcloud AI Endpoints',section: 'Inference Providers' },
  { id: 'hf-inference-api',      label: 'HF Inference API',     section: 'Inference Providers' },
  { id: 'wavespeed',             label: 'WaveSpeed',            section: 'Inference Providers' },
  // Misc
  { id: 'inference-endpoints',        label: 'Inference Endpoints',        section: 'Misc' },
  { id: 'text-generation-inference',  label: 'text-generation-inference',  section: 'Misc' },
  { id: 'eval-results-legacy',        label: 'Eval Results (legacy)',      section: 'Misc' },
  { id: 'text-embeddings-inference',  label: 'text-embeddings-inference',  section: 'Misc' },
  { id: '4-bit',                      label: '4-bit precision',            section: 'Misc' },
  { id: 'merge',                      label: 'Merge',                      section: 'Misc' },
  { id: 'custom-code',                label: 'custom_code',                section: 'Misc' },
  { id: '8-bit',                      label: '8-bit precision',            section: 'Misc' },
  { id: 'mixture-of-experts',         label: 'Mixture of Experts',         section: 'Misc' },
  { id: 'carbon-emissions',           label: 'Carbon Emissions',           section: 'Misc' },
  { id: 'eval-results',               label: 'Eval Results',               section: 'Misc' },
]
