# Exam Forge frontend

This is the static GitHub Pages interface for Exam Forge. It uses only HTML, CSS,
and JavaScript and sends PDF uploads directly to the separately deployed FastAPI
backend.

- Live site: <https://ryanwon3.github.io/exam-forge-frontend/>
- Backend API: <https://exam-forge-backend.onrender.com>

## Configure the backend URL

The checked-in `config.js` points to the live Render service. If you deploy your own
copy of the backend, edit it to use that service URL:

```js
window.EXAM_APP_CONFIG = {
  apiBaseUrl: "https://YOUR-SERVICE.onrender.com",
};
```

Do not add an OpenAI API key to this repository. The frontend never needs or receives
that key.

## Run locally

Start the backend on port 8000, then serve this directory on port 5500:

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500`.

## Deploy to GitHub Pages

1. Push this directory to a new public GitHub repository.
2. Open the repository's **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main`, and use the repository root.
4. Wait for the published URL.
5. Put that Pages origin in the backend's `ALLOWED_ORIGINS` Render environment
   variable and redeploy the backend.
6. Test the complete upload and download flow in an incognito window.
