/** Static metadata for each Data Hub connector — logo, API description, credential fields, docs. */

export interface CredentialField {
  key: string
  label: string
  placeholder: string
  secret: boolean
  hint?: string
}

export interface ConnectorMeta {
  /** Clearbit logo API URL — img onError falls back to logoInitial + logoColor */
  logoUrl: string
  /** 1-2 char initial for fallback coloured badge */
  logoInitial: string
  /** Brand colour for fallback badge */
  logoColor: string
  /** Short human-readable description of the integration */
  description: string
  /** Link to official API docs */
  docsUrl: string
  /** The API base URL (informational) */
  apiBaseUrl?: string
  /** Ordered list of fields users must fill to connect */
  credentialFields: CredentialField[]
}

export const CONNECTOR_META: Record<string, ConnectorMeta> = {
  // ─── HRM: Microsoft Active Directory ──────────────────────────────────────
  msgraph: {
    logoUrl: 'https://logo.clearbit.com/microsoft.com',
    logoInitial: 'M',
    logoColor: '#00a4ef',
    description: 'Microsoft Azure Active Directory via Microsoft Graph API — reads users, groups and org hierarchy.',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/api/user-list',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0',
    credentialFields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: 'eyJ0eXAiOiJKV1QiLCJ...',
        secret: true,
        hint: 'Azure AD Bearer token with User.Read.All (or Directory.Read.All) permission.',
      },
    ],
  },

  // ─── HRM: Workday ──────────────────────────────────────────────────────────
  workday: {
    logoUrl: 'https://logo.clearbit.com/workday.com',
    logoInitial: 'W',
    logoColor: '#f34f1c',
    description: 'Workday HCM — worker data via the Workday WQL REST API.',
    docsUrl: 'https://community.workday.com/sites/default/files/file-hosting/restapi/index.html',
    apiBaseUrl: 'https://{tenant}.workday.com/api/wql/v1',
    credentialFields: [
      {
        key: 'tenant',
        label: 'Tenant ID',
        placeholder: 'yourcompany',
        secret: false,
        hint: 'The subdomain of your Workday instance (e.g., acme for acme.workday.com).',
      },
      {
        key: 'access_token',
        label: 'OAuth Access Token',
        placeholder: 'eyJ...',
        secret: true,
        hint: 'Workday OAuth2 Bearer token.',
      },
    ],
  },

  // ─── HRM: SAP SuccessFactors ───────────────────────────────────────────────
  sapsuccessfactors: {
    logoUrl: 'https://logo.clearbit.com/sap.com',
    logoInitial: 'S',
    logoColor: '#0a73be',
    description: 'SAP SuccessFactors HCM — employee records via the OData v2 API.',
    docsUrl: 'https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM/d599f15995d348a1b45ba5603e2aba9b/03e1fc3791684367a74d4f9b5a73b1bb.html',
    apiBaseUrl: 'https://api4.successfactors.com/odata/v2',
    credentialFields: [
      {
        key: 'company_id',
        label: 'Company ID',
        placeholder: 'ACME',
        secret: false,
        hint: 'Your SuccessFactors company ID.',
      },
      {
        key: 'api_username',
        label: 'API Username',
        placeholder: 'api_user@ACME',
        secret: false,
        hint: 'Format: username@companyID',
      },
      {
        key: 'api_password',
        label: 'API Password',
        placeholder: '',
        secret: true,
      },
    ],
  },

  // ─── HRM: BambooHR ─────────────────────────────────────────────────────────
  bamboohr: {
    logoUrl: 'https://logo.clearbit.com/bamboohr.com',
    logoInitial: 'B',
    logoColor: '#73c41f',
    description: 'BambooHR — employee directory via the BambooHR REST API.',
    docsUrl: 'https://documentation.bamboohr.com/reference/get-employees-directory-1',
    apiBaseUrl: 'https://api.bamboohr.com/api/gateway.php/{subdomain}/v1',
    credentialFields: [
      {
        key: 'subdomain',
        label: 'Company Subdomain',
        placeholder: 'yourcompany',
        secret: false,
        hint: 'The part before .bamboohr.com in your BambooHR URL.',
      },
      {
        key: 'api_key',
        label: 'API Key',
        placeholder: 'abc123def456...',
        secret: true,
        hint: 'Generate in BambooHR → Account → API Keys.',
      },
    ],
  },

  // ─── HRM: Rippling ─────────────────────────────────────────────────────────
  rippling: {
    logoUrl: 'https://logo.clearbit.com/rippling.com',
    logoInitial: 'R',
    logoColor: '#ff4d00',
    description: 'Rippling — HR, IT and Finance platform. Reads employee data via the Rippling Platform API.',
    docsUrl: 'https://developer.rippling.com/documentation/reference/get-current-employee',
    apiBaseUrl: 'https://api.rippling.com/platform/api',
    credentialFields: [
      {
        key: 'access_token',
        label: 'OAuth Access Token',
        placeholder: 'Bearer token...',
        secret: true,
        hint: 'Rippling OAuth2 access token (scope: employee:read).',
      },
    ],
  },

  // ─── HRM: Personio ─────────────────────────────────────────────────────────
  personio: {
    logoUrl: 'https://logo.clearbit.com/personio.de',
    logoInitial: 'P',
    logoColor: '#5b5bff',
    description: 'Personio — HR and recruiting. Reads employee records via the Personio REST API.',
    docsUrl: 'https://developer.personio.de/reference/get_company-employees',
    apiBaseUrl: 'https://api.personio.de/v1',
    credentialFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        placeholder: 'your_client_id',
        secret: false,
        hint: 'Personio API Credential Client ID.',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        placeholder: 'your_client_secret',
        secret: true,
        hint: 'Generate in Personio → Settings → Integrations → API Credentials.',
      },
    ],
  },

  // ─── HRM: Deel ─────────────────────────────────────────────────────────────
  deel: {
    logoUrl: 'https://logo.clearbit.com/letsdeel.com',
    logoInitial: 'D',
    logoColor: '#ff4d00',
    description: 'Deel — global HR and payroll. Reads people and contracts via the Deel REST API v2.',
    docsUrl: 'https://developer.deel.com/docs/people-list',
    apiBaseUrl: 'https://api.letsdeel.com/rest/v2',
    credentialFields: [
      {
        key: 'api_token',
        label: 'API Token',
        placeholder: 'dlp_...',
        secret: true,
        hint: 'Generate in Deel → Settings → API → Create API Key.',
      },
    ],
  },

  // ─── HRM: Zoho People ──────────────────────────────────────────────────────
  zohopeople: {
    logoUrl: 'https://logo.clearbit.com/zoho.com',
    logoInitial: 'Z',
    logoColor: '#e72b2b',
    description: 'Zoho People — HR management. Reads employee records via the Zoho People API.',
    docsUrl: 'https://www.zoho.com/people/api/getrecord.html',
    apiBaseUrl: 'https://people.zoho.com/people/api',
    credentialFields: [
      {
        key: 'access_token',
        label: 'OAuth Access Token',
        placeholder: '1000.xxxxx...',
        secret: true,
        hint: 'Zoho OAuth2 access token with scope ZohoPeople.employee.READ.',
      },
    ],
  },

  // ─── HRM: HiBob ────────────────────────────────────────────────────────────
  hibob: {
    logoUrl: 'https://logo.clearbit.com/hibob.com',
    logoInitial: 'H',
    logoColor: '#4f46e5',
    description: 'HiBob — modern HCM. Reads people data via the HiBob Service User API.',
    docsUrl: 'https://apidocs.hibob.com/reference/get_people',
    apiBaseUrl: 'https://api.hibob.com/v1',
    credentialFields: [
      {
        key: 'service_user_id',
        label: 'Service User ID',
        placeholder: 'service@company.com',
        secret: false,
        hint: 'HiBob service user email address.',
      },
      {
        key: 'service_token',
        label: 'Service Token',
        placeholder: 'token...',
        secret: true,
        hint: 'Generate in HiBob → Integrations → API & Integrations → Service Users.',
      },
    ],
  },

  // ─── HRM: Leapsome ─────────────────────────────────────────────────────────
  leapsome: {
    logoUrl: 'https://logo.clearbit.com/leapsome.com',
    logoInitial: 'L',
    logoColor: '#6366f1',
    description: 'Leapsome — performance and engagement platform. Reads users via the Leapsome REST API.',
    docsUrl: 'https://api.leapsome.com/api/v1/',
    apiBaseUrl: 'https://api.leapsome.com/api/v1',
    credentialFields: [
      {
        key: 'client_id',
        label: 'API Client ID',
        placeholder: 'client_id...',
        secret: false,
        hint: 'Generate in Leapsome → Settings → Integrations → API.',
      },
      {
        key: 'client_secret',
        label: 'API Client Secret',
        placeholder: 'secret...',
        secret: true,
      },
    ],
  },

  // ─── HRM: PeopleForce ──────────────────────────────────────────────────────
  peopleforce: {
    logoUrl: 'https://logo.clearbit.com/peopleforce.io',
    logoInitial: 'P',
    logoColor: '#2563eb',
    description: 'PeopleForce — HR platform. Reads employee data via the PeopleForce REST API.',
    docsUrl: 'https://apidoc.peopleforce.io/',
    apiBaseUrl: 'https://api.peopleforce.io',
    credentialFields: [
      {
        key: 'api_key',
        label: 'API Key',
        placeholder: '',
        secret: true,
        hint: 'Generate in PeopleForce → Settings → Account → API Keys.',
      },
    ],
  },

  // ─── HRM: Factorial ────────────────────────────────────────────────────────
  factorial: {
    logoUrl: 'https://logo.clearbit.com/factorialhr.com',
    logoInitial: 'F',
    logoColor: '#fa4616',
    description: 'Factorial — HR and payroll for SMBs. Reads employees via the Factorial REST API.',
    docsUrl: 'https://apidoc.factorialhr.com/docs',
    apiBaseUrl: 'https://api.factorialhr.com/api/v1',
    credentialFields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: 'eyJ...',
        secret: true,
        hint: 'Factorial OAuth2 Bearer token.',
      },
    ],
  },

  // ─── Personal: Google Drive / Docs ─────────────────────────────────────────
  googledrive: {
    logoUrl: 'https://logo.clearbit.com/google.com',
    logoInitial: 'G',
    logoColor: '#4285f4',
    description: 'Google Drive & Docs — reads your files and documents via the Google Drive API v3.',
    docsUrl: 'https://developers.google.com/drive/api/guides/about-sdk',
    apiBaseUrl: 'https://www.googleapis.com/drive/v3',
    credentialFields: [
      {
        key: 'access_token',
        label: 'OAuth Access Token',
        placeholder: 'ya29...',
        secret: true,
        hint: 'Google OAuth2 token with scope https://www.googleapis.com/auth/drive.readonly.',
      },
    ],
  },

  // ─── Personal: LinkedIn ──────────────────────────────────────────────────
  linkedin: {
    logoUrl: 'https://logo.clearbit.com/linkedin.com',
    logoInitial: 'in',
    logoColor: '#0a66c2',
    description: 'LinkedIn — reads your profile and connections via the LinkedIn API v2.',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow',
    apiBaseUrl: 'https://api.linkedin.com/v2',
    credentialFields: [
      {
        key: 'access_token',
        label: 'OAuth Access Token',
        placeholder: 'AQV...',
        secret: true,
        hint: 'LinkedIn OAuth2 access token (scope: r_liteprofile).',
      },
    ],
  },

  // ─── Personal: TikTok ────────────────────────────────────────────────────
  tiktok: {
    logoUrl: 'https://logo.clearbit.com/tiktok.com',
    logoInitial: 'TT',
    logoColor: '#010101',
    description: 'TikTok — reads your profile and videos via the TikTok Open Platform API v2.',
    docsUrl: 'https://developers.tiktok.com/doc/overview/',
    apiBaseUrl: 'https://open.tiktokapis.com/v2',
    credentialFields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: 'att.xxx...',
        secret: true,
        hint: 'TikTok Open Platform access token (scope: user.info.basic).',
      },
    ],
  },

  // ─── Personal: Douyin (抖音) ─────────────────────────────────────────────
  douyin: {
    logoUrl: 'https://logo.clearbit.com/douyin.com',
    logoInitial: '抖',
    logoColor: '#161823',
    description: '抖音 (Douyin) — 通过抖音开放平台 API 读取个人信息和作品数据。',
    docsUrl: 'https://open.douyin.com/platform/doc/OpenAPI-overview',
    apiBaseUrl: 'https://open.douyin.com',
    credentialFields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: '',
        secret: true,
        hint: '抖音开放平台 access_token（需申请应用并授权）。',
      },
    ],
  },

  // ─── Personal: Weibo (微博) ──────────────────────────────────────────────
  weibo: {
    logoUrl: 'https://logo.clearbit.com/weibo.com',
    logoInitial: '微',
    logoColor: '#e6162d',
    description: '微博 (Weibo) — 通过微博开放平台 API 读取用户信息。',
    docsUrl: 'https://open.weibo.com/wiki/2/users/show',
    apiBaseUrl: 'https://api.weibo.com/2',
    credentialFields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: '',
        secret: true,
        hint: '微博 OAuth2 access_token。',
      },
      {
        key: 'uid',
        label: 'User UID',
        placeholder: '1234567890',
        secret: false,
        hint: '微博用户 UID（显示在个人主页 URL 中）。',
      },
    ],
  },

  // ─── Personal: Facebook (GDPR export only) ──────────────────────────────
  facebook: {
    logoUrl: 'https://logo.clearbit.com/facebook.com',
    logoInitial: 'f',
    logoColor: '#1877f2',
    description: 'Facebook — import your data archive (.zip) downloaded from Facebook Settings.',
    docsUrl: 'https://www.facebook.com/help/1701730696756992',
    credentialFields: [],
  },

  // ─── Personal: Instagram (GDPR export only) ─────────────────────────────
  instagram: {
    logoUrl: 'https://logo.clearbit.com/instagram.com',
    logoInitial: 'IG',
    logoColor: '#e1306c',
    description: 'Instagram — import your data archive (.zip) downloaded from Instagram Settings.',
    docsUrl: 'https://help.instagram.com/181231772500920',
    credentialFields: [],
  },

  // ─── Personal: Xiaohongshu (小红书, GDPR export only) ───────────────────
  xiaohongshu: {
    logoUrl: 'https://logo.clearbit.com/xiaohongshu.com',
    logoInitial: '红',
    logoColor: '#fe2c55',
    description: '小红书 (Xiaohongshu) — 导入从小红书下载的数据文件。',
    docsUrl: 'https://www.xiaohongshu.com/user/profile',
    credentialFields: [],
  },
}
