# How to Create and Configure a GitHub App

This guide will walk you through the steps to create a GitHub App and obtain the necessary credentials for your `.env` file.

## Step 1: Create the GitHub App

1. Go to your GitHub profile and click on **Settings**.
2. Scroll down on the left sidebar and click on **Developer settings** (at the very bottom).
3. Click on **GitHub Apps** in the left sidebar, then click the **New GitHub App** button.
4. Fill in the following basic details:
   - **GitHub App name**: Give it a unique name (e.g., `kyro-deploy-yourname`).
   - **Homepage URL**: Set this to your local URL for development (e.g., `http://localhost:3000`) or your production domain.
   - **Callback URL**: Optional, but if using Better Auth / OAuth, set it to `http://localhost:3000/api/auth/callback/github`.

## Step 2: Configure Webhooks

1. Under the **Webhook** section, check **Active**.
2. **Webhook URL**: Enter the URL where your app will receive webhook events (e.g., `http://localhost:3000/api/webhooks/github`). _If you use a local environment, you might need a tool like ngrok to expose your local server to GitHub, or temporarily disable webhooks if you don't need them yet._
3. **Webhook secret**: Generate a secure random string (e.g., `my_super_secret_webhook_string`) and paste it here.
   - **Save this value**: You will need it for `GITHUB_APP_WEBHOOK_SECRET` in your `.env` file.

## Step 3: Set Permissions

Scroll down to the **Repository permissions** section. Depending on what Kyro needs to do, you'll need at least the following permissions:

- **Contents**: `Read-only` (or `Read & write` if the app needs to push commits).
- **Metadata**: `Read-only` (mandatory for all apps).
- **Webhooks**: `Read & write` (if your app manages webhooks on repositories).

Under **Subscribe to events**, select the events your app needs to listen to (e.g., `Push`, `Repository`, `Pull request`).

## Step 4: Choose Installation Setup

1. Under **Where can this GitHub App be installed?**, select **Any account** if you want other users to install it, or **Only on this account** if it's just for you.
2. Click the **Create GitHub App** button.

---

## Step 5: Gather Your Credentials

Once the app is created, you will be on the app's settings page. Here is how to find the values for your `.env` file:

### 1. `GITHUB_APP_ID`

- At the top of the General settings page, you will see your **App ID**.
- Copy this and set it as `GITHUB_APP_ID` in your `.env`.

### 2. `GITHUB_APP_PRIVATE_KEY`

- Scroll down to the **Private keys** section and click **Generate a private key**.
- A `.pem` file will be downloaded to your computer.
- Open the `.pem` file in a text editor. It looks like this:
  ```text
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpQIBAAKCAQEA...
  -----END RSA PRIVATE KEY-----
  ```
- Because `.env` files don't handle multiline strings well, you must **Base64 encode** it.
  - **On Mac/Linux**: Run this command in your terminal: `cat your-key-file.pem | base64 | tr -d '\n'`
  - **On Windows**: You can use a secure online base64 encoder, or PowerShell: `[convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your-key-file.pem"))`
- Copy the output and set it as `GITHUB_APP_PRIVATE_KEY` in your `.env`.

### 3. `GITHUB_APP_WEBHOOK_SECRET`

- This is the string you created in **Step 2**. Set it as `GITHUB_APP_WEBHOOK_SECRET` in your `.env`.

### 4. `GITHUB_APP_INSTALLATION_URL`

- In the left sidebar of your GitHub App settings, click on **Public page**.
- You will see the public URL for your app (e.g., `https://github.com/apps/kyro-deploy-yourname`).
- Add `/installations/new` to the end of that URL.
- It should look like: `https://github.com/apps/kyro-deploy-yourname/installations/new`.
- Set this as `GITHUB_APP_INSTALLATION_URL` in your `.env`.

---

## Final Step: Install the App

Before you can use the app to fetch your repositories, you need to install it on your GitHub account.

1. Click on **Install App** in the left sidebar of your GitHub App settings.
2. Click the **Install** button next to your account.
3. Select whether you want to give it access to **All repositories** or **Only select repositories**.
4. Click **Install**.

You're all set! Restart your Next.js development server to apply the `.env` changes.
