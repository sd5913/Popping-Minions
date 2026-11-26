# Builds, previews and deployment

| Build | Source | Automation | URL |
| --- | --- | --- | --- |
| Missed This Stop | `missed-this-stop/` | Cloudflare Pages Git integration builds from `main` with `npm run build` and publishes `dist`. It also posts per-branch preview URLs on GitHub. | [Cloudflare production](https://popping-minions.pages.dev/) |
| The Open Wild | `games/open-wild/` | The [GitHub Pages workflow](../.github/workflows/open-wild-pages.yml) builds with Node 22 and runs after relevant changes reach `main` or on manual dispatch. | [GitHub Pages production](https://sd5913.github.io/Popping-Minions/) |

Cloudflare Pages is configured to use `missed-this-stop/` as its root directory. A future move of that folder must be coordinated with the Cloudflare project settings.

For a PR preview of **Missed This Stop**, open the **Cloudflare Pages** check and follow its **Preview URL**. For **Open Wild**, use the PR's build artifact or run the PR branch locally. [Cloudflare Git integration reference](https://developers.cloudflare.com/pages/configuration/git-integration/).

[Game Code Check](../.github/workflows/code-check.yml) runs on PRs to `main` and again after merge. It checks the original HTML prototype and builds both Vite applications from their lockfiles. To play the Open Wild PR artifact, open the PR’s **Check Game Code** run and download **open-wild-pr-build** under **Artifacts**. Extract it, run `python3 -m http.server 8000` in the extracted directory and open `http://localhost:8000/`.

## Credentials

The current Cloudflare deployment uses the Cloudflare GitHub App. GitHub Pages uses its workflow's GitHub-managed token and OIDC permissions. The published apps use public client-side dependencies and currently require no project API key for deployment.

For any future credential used by a GitHub Actions deployment, create a secret under **Settings → Environments → the target environment** and reference it through the workflow's `secrets` context. Keep keys out of repository files, workflow logs and browser bundles. A Vite `VITE_*` variable is exposed to the browser. A feature requiring a private service key should read it server-side.

## Verify a deployment

1. Open the commit or PR and verify the build checks. Play the Cloudflare preview when reviewing changes to the camera build.
2. After merge, check the applicable deployment status against the merge commit.
3. Open the public link and try the changed chapter or control. Record the browser, result and any failure in the PR or backlog.
