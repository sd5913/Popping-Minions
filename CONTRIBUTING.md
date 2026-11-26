# Contributing

1. Update your local `main` and create a branch, such as `feat/chapter-four`, `fix/hand-input` or `docs/sprint-review`.
2. Make focused commits. Include game source, lockfiles and required runtime resources. Keep credentials, installed dependencies and generated builds out of Git.
3. Push the branch and open a pull request into `main`. Link the related issue or backlog item. State the change, how you verified it and any manual tests still needed.
4. Ask another team member with write access to review the PR. For gameplay changes, use the Cloudflare preview when it covers the build under review and record the browser, revision and observed behavior.
5. Merge through GitHub after **Check Game Code** passes, review conversations are resolved and a teammate has approved. New changes require renewed approval. The rule also applies to administrators.

```bash
git switch main
git pull --ff-only
git switch -c feat/example
# Edit and stage the files for the task.
git commit -m "Describe the change"
git push -u origin feat/example
```

Record completed work and decisions in the appropriate [Scrum record](scrum/). Keep reviews in the original PR. For build and Secrets details, see [deployment](docs/DEPLOYMENT.md).
