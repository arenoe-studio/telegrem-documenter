# 🚀 Deployment Guide: Filestash on Koyeb

This guide explains how to deploy **Filestash** as a Web UI for your Backblaze B2 bucket using the Koyeb platform.

## 📋 1. Environment Variable Cheat Sheet

Copy these values to your Koyeb Service configuration. Replace the placeholders `<...>` with your actual values from `.env` or Backblaze dashboard.

| Variable Name          | Value / Example                     | Description                                                 |
| :--------------------- | :---------------------------------- | :---------------------------------------------------------- |
| `ONLY_PLUGINS`         | `s3`                                | Only load S3 plugin for speed & security                    |
| `APPLICATION_URL`      | `https://<your-app-name>.koyeb.app` | Your public Koyeb URL (optional but recommended)            |
| `INIT_ADMIN_PASSWORD`  | `<secure-random-password>`          | **IMPORTANT**: Password for the 'admin' user on first login |
| `S3_ENDPOINT`          | `s3.<region>.backblazeb2.com`       | e.g. `s3.us-east-005.backblazeb2.com`                       |
| `S3_REGION`            | `<region>`                          | e.g. `us-east-005`                                          |
| `S3_ACCESS_KEY_ID`     | `<your-b2-key-id>`                  | Your **B2 Application Key ID**                              |
| `S3_SECRET_ACCESS_KEY` | `<your-b2-application-key>`         | Your **B2 Application Key** (Secret)                        |
| `S3_BUCKET`            | `<your-bucket-name>`                | The name of your B2 bucket                                  |

> 💡 **Tip**: Get these values from your `.env` file (`B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, etc.) or the Backblaze B2 Dashboard.

---

## 🛠️ 2. Deployment Steps (Beginner Friendly)

### Step 1: Push Code to GitHub

Ensure the new `deploy/Dockerfile.filestash` file is pushed to your repository:

```bash
git add deploy/Dockerfile.filestash
git commit -m "feat: add filestash dockerfile"
git push origin main
```

### Step 2: Create Service on Koyeb

1. Login to your [Koyeb Dashboard](https://app.koyeb.com/).
2. Click **Create Service**.
3. Select **GitHub** as the deployment method.
4. Choose your repository: `arenoe-studio/telegrem-documenter`.
5. **Builder config**:
   - **Type**: Dockerfile
   - **Dockerfile location**: `deploy/Dockerfile.filestash` (⚠️ Important: Change default `Dockerfile` to this path)
   - **Privileged**: No

### Step 3: Configure Ports & Variables

1. **Ports**: Change the exposed port from `8000` to **`8334`**.
2. **Environment Variables**:
   - Click "Add Variable" for each item in the **Cheat Sheet** above.
   - For `S3_SECRET_ACCESS_KEY` and `INIT_ADMIN_PASSWORD`, use the **Secret** type for safety.
3. Click **Deploy**.

---

## 🔒 3. Post-Deployment Setup

1. Wait for the service status to become **Healthy**.
2. Open your public URL (e.g., `https://my-filestash.koyeb.app`).
3. You will be prompted to set an admin password (if `INIT_ADMIN_PASSWORD` didn't auto-set it) or login directly.
4. Since we pre-configured the S3 connection via Environment Variables, you might see your files immediately or be asked to confirm the S3 backend.
5. If asked for a "Backend" connection manually:
   - Choose **S3**.
   - Endpoint: `s3.<region>.backblazeb2.com`
   - Access Key: (Your Key ID)
   - Secret Key: (Your App Key)
   - **Advanced**: Enable "Use Path Request Style" if connection fails.

---

## 🔄 Automatic Redeployment

Since you linked a GitHub repository, **any change** you push to the `main` branch will trigger a redeploy.

- To prevent this service from redeploying when you only change the Bot code, you can set **User Defined Triggers** in Koyeb settings to only deploy when files in `deploy/` change (if supported) or manually manage deployments.
- However, standard behavior is auto-deploy on push. This ensures your Filestash instance always uses the latest base image if you update the Dockerfile.
