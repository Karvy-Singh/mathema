// =============================================================
//  Mathēma — Azure infrastructure (Bicep)
//
//  배포 자원 (Central India 권장):
//    - Log Analytics + Application Insights
//    - Azure Container Registry (ACR)
//    - Azure Container Apps Environment + Container App (backend NestJS)
//    - PostgreSQL Flexible Server 16 + 'mathema' database
//    - Azure Cache for Redis (Basic C0 — PoC)
//    - Azure Key Vault (secrets: DB url, Redis key, JWT secrets, LLM keys)
//    - Azure Static Web App (frontend Vite SPA)
//    - Azure OpenAI account (opt-in — provisionAzureOpenAi=true)
//
//  배포:
//    az deployment group create \
//      --resource-group mathema-rg \
//      --template-file infra/bicep/main.bicep \
//      --parameters @infra/bicep/main.parameters.json
//
//  PoC 예상 월 비용 (Central India, sustained):
//    Container Apps (1 replica, 0.5 vCPU/1Gi):  ~$25
//    PostgreSQL Flexible B1ms 32GB:             ~$25
//    Cache for Redis Basic C0:                  ~$16
//    Static Web App Free:                       $0
//    Application Insights (5 GB/mo):            ~$10
//    Azure OpenAI (GPT-4o, 1M tokens/mo):       ~$15
//    ACR Basic:                                 ~$5
//    Total:                                     ~$96 → $10k 크레딧으로 100개월
// =============================================================

@description('Resource prefix — also used as DNS-safe parts of resource names.')
param namePrefix string = 'mathema'

@description('Azure region. Central India recommended for India PoC.')
param location string = 'centralindia'

@description('Container image tag (set by CI: e.g. \\$(Build.BuildId) or git short SHA).')
param containerImageTag string = 'latest'

@description('PostgreSQL admin login.')
param dbAdminUsername string = 'mathemaadmin'

@secure()
@description('PostgreSQL admin password — must satisfy Azure complexity rules.')
param dbAdminPassword string

@description('Initial backend container CPU.')
param containerCpu string = '0.5'

@description('Initial backend container memory.')
param containerMemory string = '1.0Gi'

@description('Min replicas — scale-to-zero=0, always-on=1.')
param minReplicas int = 1

@description('Max replicas — auto-scale ceiling on HTTP concurrency.')
param maxReplicas int = 5

@description('Provision Azure OpenAI account in this RG. Set false if using shared instance.')
param provisionAzureOpenAi bool = true

@description('Anthropic API key (optional — fallback LLM provider).')
@secure()
param anthropicApiKey string = ''

@description('JWT access token secret (32+ chars, random).')
@secure()
param jwtAccessSecret string

@description('JWT refresh token secret (32+ chars, random — different from access).')
@secure()
param jwtRefreshSecret string

var uniqueSuffix = uniqueString(resourceGroup().id)
var registryName = toLower('${namePrefix}acr${uniqueSuffix}')
var logAnalyticsName = '${namePrefix}-logs'
var appInsightsName = '${namePrefix}-ai'
var containerEnvName = '${namePrefix}-cae'
var backendAppName = '${namePrefix}-backend'
var dbServerName = '${namePrefix}-pg-${uniqueSuffix}'
var dbName = 'mathema'
var redisName = '${namePrefix}-redis-${uniqueSuffix}'
var keyVaultName = '${namePrefix}-kv-${take(uniqueSuffix, 6)}'
var aoaiName = '${namePrefix}-aoai-${take(uniqueSuffix, 4)}'
var swaName = '${namePrefix}-swa'

// ---------- Log Analytics + Application Insights ----------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ---------- ACR ----------

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: registryName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true   // PoC 편의 — production 에서는 managed identity 권장
  }
}

// ---------- PostgreSQL Flexible Server ----------

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: dbServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    version: '16'
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource pgFirewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'   // (special: Azure 내부 from any region)
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: dbName
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

// ---------- Redis ----------

resource redis 'Microsoft.Cache/redis@2024-03-01' = {
  name: redisName
  location: location
  properties: {
    sku: { name: 'Basic', family: 'C', capacity: 0 }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisVersion: '6'
  }
}

// ---------- Azure OpenAI (optional) ----------

resource aoai 'Microsoft.CognitiveServices/accounts@2024-10-01' = if (provisionAzureOpenAi) {
  name: aoaiName
  location: location
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: aoaiName
    publicNetworkAccess: 'Enabled'
  }
}

resource aoaiGpt4o 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = if (provisionAzureOpenAi) {
  parent: aoai
  name: 'gpt-4o'
  sku: { name: 'Standard', capacity: 10 }   // 10 K TPM — PoC
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-08-06' }
  }
}

// ---------- Key Vault ----------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

// Secrets (RBAC-protected — Container App 의 managed identity 가 읽음)
resource kvDbUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
  }
}

resource kvRedisUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'redis-url'
  properties: {
    value: 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}'
  }
}

resource kvJwtAccess 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-access-secret'
  properties: { value: jwtAccessSecret }
}

resource kvJwtRefresh 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-refresh-secret'
  properties: { value: jwtRefreshSecret }
}

resource kvAnthropic 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(anthropicApiKey)) {
  parent: keyVault
  name: 'anthropic-api-key'
  properties: { value: anthropicApiKey }
}

resource kvAoaiKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (provisionAzureOpenAi) {
  parent: keyVault
  name: 'aoai-api-key'
  properties: { value: aoai.listKeys().key1 }
}

// ---------- Container Apps Environment ----------

resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ---------- Backend Container App ----------

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4000
        transport: 'auto'
        corsPolicy: {
          allowedOrigins: [ 'https://*.azurestaticapps.net', 'http://localhost:5173' ]
          allowedMethods: [ 'GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS' ]
          allowedHeaders: [ '*' ]
          allowCredentials: true
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password',         value: acr.listCredentials().passwords[0].value }
        { name: 'database-url',         keyVaultUrl: kvDbUrl.properties.secretUri,         identity: 'system' }
        { name: 'redis-url',            keyVaultUrl: kvRedisUrl.properties.secretUri,      identity: 'system' }
        { name: 'jwt-access-secret',    keyVaultUrl: kvJwtAccess.properties.secretUri,     identity: 'system' }
        { name: 'jwt-refresh-secret',   keyVaultUrl: kvJwtRefresh.properties.secretUri,    identity: 'system' }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/mathema-backend:${containerImageTag}'
          resources: { cpu: json(containerCpu), memory: containerMemory }
          env: [
            { name: 'NODE_ENV',            value: 'production' }
            { name: 'PORT',                value: '4000' }
            { name: 'DATABASE_URL',        secretRef: 'database-url' }
            { name: 'REDIS_URL',           secretRef: 'redis-url' }
            { name: 'JWT_ACCESS_SECRET',   secretRef: 'jwt-access-secret' }
            { name: 'JWT_REFRESH_SECRET',  secretRef: 'jwt-refresh-secret' }
            { name: 'APPINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
            { name: 'LLM_PROVIDER',        value: provisionAzureOpenAi ? 'azure-openai' : 'anthropic' }
            { name: 'AZURE_OPENAI_ENDPOINT',   value: provisionAzureOpenAi ? aoai.properties.endpoint : '' }
            { name: 'AZURE_OPENAI_INSTANCE',   value: provisionAzureOpenAi ? aoaiName : '' }
            { name: 'AZURE_OPENAI_DEPLOYMENT', value: 'gpt-4o' }
            { name: 'AZURE_OPENAI_API_VERSION', value: '2024-08-01-preview' }
          ]
          probes: [
            {
              type: 'liveness'
              httpGet: { path: '/api/v1/health/live', port: 4000 }
              initialDelaySeconds: 20
              periodSeconds: 30
            }
            {
              type: 'readiness'
              httpGet: { path: '/api/v1/health/ready', port: 4000 }
              initialDelaySeconds: 10
              periodSeconds: 15
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scale'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

// Key Vault 접근 권한 — managed identity 에 Key Vault Secrets User 부여
resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, backendApp.id, 'kv-secrets-user')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------- Static Web App (frontend Vite SPA) ----------

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: location
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    repositoryUrl: 'https://github.com/prior89/mathema'   // GitHub Actions 가 빌드/푸시
    branch: 'main'
    buildProperties: {
      appLocation: 'frontend'
      apiLocation: ''
      outputLocation: 'dist'
    }
  }
}

// ---------- Outputs ----------

output backendUrl       string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output appInsightsKey   string = appInsights.properties.ConnectionString
output acrLoginServer   string = acr.properties.loginServer
output keyVaultName     string = keyVault.name
output swaDefaultHostname string = swa.properties.defaultHostname
