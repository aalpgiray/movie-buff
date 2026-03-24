# GitHub Workflows Setup

v0 cannot create dotfiles like `.github/workflows/` directly. Run this command once to set them up:

```bash
# From the project root:
mkdir -p .github/workflows
cp github-workflows/autoformat.yml .github/workflows/
cp github-workflows/prettierrc .prettierrc
cp github-workflows/prettierignore .prettierignore
git add .github .prettierrc .prettierignore
git commit -m "ci: add autoformat workflow and prettier config"
git push
```

After running this, you can delete the `github-workflows/` folder:

```bash
rm -rf github-workflows
git add -A
git commit -m "chore: remove temp workflow folder"
git push
```
