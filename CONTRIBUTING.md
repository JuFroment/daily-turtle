# Contributing

This document describes the development workflow and conventions used for Daily Turtle.

These guidelines help keep the project simple, consistent, and enjoyable to work on.

This document is intended to evolve alongside the project.

## Philosophy

- Keep pull requests small.
- One PR = one intention.
- Improve the project one step at a time.
- Document important decisions.

## Main Branch Protection

The `main` branch is protected.

- Changes must be merged through Pull Requests.
- Direct pushes to `main` are disabled.
- Force pushes are blocked.
- The branch cannot be deleted.

## Development Workflow

- Create or choose an issue.
- Create a branch.
- Implement the change.
- Test the change.
- Commit the changes.
- Open a pull request.
- Perform a self-review.
- Merge the pull request.
- Switch back to `main`.
- Delete the merged branch.

## Branch Naming

Examples: 

```text
feature/13-add-turtle-to-xp-bar
bugfix/15-fix-automatic-labels
docs/10-add-contributing-md
technical/5-reorganize-project-structure
devops/9-add-gitattributes
```

## Typical Git Workflow

```bash
git switch main
git pull

git switch -c feature/13-add-turtle-to-xp-bar
git push -u origin feature/13-add-turtle-to-xp-bar

# Development...

git add .
git diff --staged
git commit -m "feat: add turtle to xp bar"
git push

# Open a Pull Request
# Self-review
# Merge

git switch main
git pull
git branch -d feature/13-add-turtle-to-xp-bar
```

## Commit Messages

General format: 
```text
<type>: <description>
```

Example: 
```text
docs: add CONTRIBUTING.md
```

| Type | When to use it | Example |
|------|----------------|---------|
| feat | New feature | `feat: add daily quest reset` |
| fix | Bug fix | `fix: improve issue templates` |
| docs | Documentation only | `docs: add CONTRIBUTING.md` |
| refactor | Code restructuring without changing behavior | `refactor: simplify quest rendering` |
| style | Code style changes that do not affect behavior | `style: format CSS files` |
| test | Add or update tests | `test: add quest reset tests` |
| chore | Maintenance tasks and tooling | `chore: update issue templates` |

## Pull Requests

- Link the pull request to an issue.
- Use "Closes #xx".
- Explain the summary of changes.
- Perform a self-review before requesting a review.

## Self Review

- Check `git diff`.
- Check `git diff --staged`.
- Reread PR.
- Test the changes (if possible).
- Check for unrelated changes.

A self-review should explain what has been verified before merging.
Template for self reviews:
```
Self-review completed.

Verified that:

- ...
- ...
- ...

Ready to merge.
```

## Testing

- Verify that the implemented change works as intended.
- Verify that existing features still work (regression testing).

## Issue Templates

Choose the issue template that best matches the intended work.

## Branch Cleanup

Delete merged branches only after updating the local `main` branch.

## General Conventions

- A PR tells only one story.
- Minor improvements related to the same topic can be grouped together.
- New features deserve a new issue. 

## Documentation

- Update documentation when a change modifies project behavior or conventions.
- Keep documentation concise and consistent with the current project state.
- Do not document planned behavior as if it already exists.

## Scope Changes

- Minor improvements related to the current intention may be included.
- Unrelated changes should be moved to a separate issue.
- If the scope changes significantly, consider creating a new issue instead.

## Consistency

- Prefer consistency over cleverness.
- Follow established project conventions.
- Prefer improving existing conventions over introducing new ones.
