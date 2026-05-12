# Mathēma — Azure 배포 가이드

> 인도 PoC 권장: **Central India** 리전. $10k 크레딧으로 약 100개월 운영 가능 (월 ~$96 추산).

## 1) 사전 준비

```bash
# Azure CLI 로그인
az login
az account set --subscription <SUBSCRIPTION_ID>

# Resource group
az group create -n mathema-rg -l centralindia
```

## 2) 시크릿 생성 (배포 1회만)

```bash
# JWT secrets — 32+ chars random
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# 2개 생성 (access / refresh)

# PostgreSQL admin password — 영문 대소 + 숫자 + 특수문자 8자 이상
```

`infra/bicep/main.parameters.json` 의 다음 값을 채우거나, 명령행 `--parameters key=value` 로 주입.

## 3) 인프라 배포 (Bicep)

```bash
az deployment group create \
  --resource-group mathema-rg \
  --template-file infra/bicep/main.bicep \
  --parameters @infra/bicep/main.parameters.json \
  --parameters dbAdminPassword='<paste>' jwtAccessSecret='<paste>' jwtRefreshSecret='<paste>'
```

배포되는 자원:
- Log Analytics + Application Insights
- ACR (mathemaacr<unique>)
- PostgreSQL Flexible 16 (B1ms, 32 GB)
- Cache for Redis (Basic C0)
- Container Apps Environment + backend Container App
- Key Vault (DB url, Redis url, JWT, AOAI key)
- Azure OpenAI account + gpt-4o deployment (10K TPM)
- Static Web App (frontend Vite SPA)

출력값:
- `backendUrl` — 백엔드 API base
- `swaDefaultHostname` — 프론트 도메인
- `acrLoginServer` — CI 가 푸시할 ACR 주소
- `keyVaultName`, `appInsightsKey`

## 4) GitHub Actions OIDC 페더레이션 설정

```bash
# App registration (Federated identity 용)
APP_ID=$(az ad app create --display-name mathema-github-deploy --query appId -o tsv)
SP_ID=$(az ad sp create --id $APP_ID --query id -o tsv)

# Resource group 에 Contributor 권한
az role assignment create --assignee $APP_ID --role Contributor --scope $(az group show -n mathema-rg --query id -o tsv)

# Federated credential — main 브랜치에 push 트리거 허용
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:prior89/mathema:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

echo "AZURE_CLIENT_ID = $APP_ID"
echo "AZURE_TENANT_ID = $(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID = $(az account show --query id -o tsv)"
```

위 3개 값을 GitHub repo `Settings → Secrets and variables → Actions` 에 등록:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_ACR_NAME`  (`az acr show -g mathema-rg --query name -o tsv` 결과)
- `AZURE_STATIC_WEB_APPS_API_TOKEN`  (`az staticwebapp secrets list -n mathema-swa -g mathema-rg --query properties.apiKey -o tsv`)
- `VITE_API_BASE`  (`https://<backendUrl>/api/v1`)

## 5) 배포 실행

`main` 브랜치 push 시 자동:
- `backend/**` 변경 → ACR 빌드/푸시 + Container App revision 교체
- `frontend/**` 변경 → SWA 빌드/배포

수동: `Actions` 탭에서 `workflow_dispatch`.

## 6) 검증

```bash
BACKEND=$(az containerapp show -n mathema-backend -g mathema-rg --query properties.configuration.ingress.fqdn -o tsv)
curl https://$BACKEND/api/v1/health/ready
# → {"status":"ready","checks":{"db":"ok","redis":"ok"},...}
```

## 7) 운영 명령어

```bash
# 실시간 로그
az containerapp logs show -n mathema-backend -g mathema-rg --follow

# 스케일 변경
az containerapp update -n mathema-backend -g mathema-rg --min-replicas 0 --max-replicas 10

# DB 접속 (psql)
az postgres flexible-server connect -n <db-server> -u mathemaadmin -d mathema

# Key Vault secret 갱신
az keyvault secret set --vault-name <kv-name> --name anthropic-api-key --value <new-key>
```

## 8) 비용 통제

- Container Apps `minReplicas=0` 으로 야간 휴면 → ~$10/mo 절약 (cold start 0.5~2s)
- Application Insights 샘플링: `samplingPercentage: 20` 으로 ingestion 80% 감소
- PostgreSQL: 야간 자동 정지 (Burstable B 계열만 지원 X — 향후 Stop on schedule 적용 시)
