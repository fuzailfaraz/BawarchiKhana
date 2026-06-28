$PROJECT_ID="project-eded92db-f2c8-481e-b0c"
$SERVICE_ACCOUNT="248619180591@cloudbuild.gserviceaccount.com"
$DB_URL="postgresql://postgres:BawarchiKhana@localhost/bawarchikhana?host=/cloudsql/${PROJECT_ID}:asia-south1:bawarchikhanadb"

Write-Host "Fixing IAM Permissions for Cloud Build..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SERVICE_ACCOUNT" `
  --role="roles/storage.admin" --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SERVICE_ACCOUNT" `
  --role="roles/run.admin" --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SERVICE_ACCOUNT" `
  --role="roles/cloudsql.client" --quiet

Write-Host "Enabling Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com

Write-Host "Deploying to Cloud Run (with all env vars)..."
Set-Location backend
gcloud run deploy bawarchikhana-backend `
  --source . `
  --platform managed `
  --region asia-south1 `
  --allow-unauthenticated `
  --add-cloudsql-instances "${PROJECT_ID}:asia-south1:bawarchikhanadb" `
  --update-env-vars "DATABASE_URL=${DB_URL},JWT_SECRET=your-super-secret-jwt-key-change-this"
Set-Location ..

Write-Host "------------------------------------------------------"
Write-Host "Deployment complete! Backend is live on Cloud Run."
Write-Host "Push your frontend to Git to trigger Vercel redeploy."
Write-Host "------------------------------------------------------"
