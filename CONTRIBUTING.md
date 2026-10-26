# **CONTRIBUTING 🤝**

Thank you for contributing to **lin-pulsar**, the repository hosting `LinPulsar` (`@linagora/lin-pulsar`), the Pulsar component catalog of **LinOpenFactory**.

This is a **single-package repository**: the library is consumed by the platform applications through **Module Federation**, under the `LinPulsar` remote name.

This document explains the conventions, workflows, and best practices to follow when contributing to this project.

---

# **📌 Git Conventions**

## **🌿 Branch Naming**

All branches must follow one of the following naming patterns:

| Type            | Pattern                           | Example                             |
| --------------- | --------------------------------- | ----------------------------------- |
| **Main**        | `main` or `dev`                   | `main`                              |
| **Feature**     | `feature/<short-description>`     | `feature/lin-pulsar-add-icons`      |
| **Bugfix**      | `bugfix/<short-description>`      | `bugfix/fix-catalog-render-error`   |
| **Improvement** | `improvement/<short-description>` | `improvement/refactor-smart-filter` |
| **Release**     | `release/<version>`               | `release/1.3.0`                     |
| **Hotfix**      | `hotfix/<short-description>`      | `hotfix/catalog-missing-export`     |

### **Rules**

✔ lowercase only
✔ dashes (`-`), underscores (`_`) and dots (`.`) allowed
✔ branch names must be short and descriptive
✔ use English for descriptions

Branch naming is enforced by CI on every pull request.

---

## **📝 Commit Message Format (Conventional Commits)**

This project follows the **Conventional Commits** format:

```
<type>(<scope>): <short summary>
```

The scope is **optional** and commit messages are validated in CI by **commitlint** on every pull request.

### **Accepted types**

- `feat` – A new feature
- `fix` – A bug fix
- `docs` – Documentation changes only
- `style` – Code formatting only (no logic)
- `refactor` – Code refactoring without behavior change
- `perf` – Performance improvements
- `test` – Test-related changes
- `security` – Security-related changes
- `deprecated` – Deprecation of APIs or components
- `chore` – Internal tooling, CI, dependency bumps…
- `build` – Build pipeline or configuration updates

---

## **📦 Versioning Rules**

This repository hosts a **single package** (`@linagora/lin-pulsar`): versioning is **global to the repository** and driven by **commit types** (see the Releases section below).

### 📌 Summary table

| Commit                       | Meaning               | Version impact |
| ---------------------------- | --------------------- | -------------- |
| `feat: ...`                  | New feature           | minor bump     |
| `fix: ...`                   | Bug fix               | patch bump     |
| `feat!:` / `BREAKING CHANGE` | Breaking change       | major bump     |
| `docs:`, `chore:`, …         | No user-facing change | no bump        |

### 📌 About scopes

The scope no longer determines which package receives a version bump (there is only one). It remains useful to indicate the impacted area of the library:

```
feat(smart-filter): add saved favorite filters
```

Examples of useful scopes: a component family (`field`, `card`, `smart-filter`), a concern (`i18n`, `federation`, `docs`)…

---

## **🔏 Commit Signing**

All commits **must be signed**:
Unsigned commits will be rejected.

---

# **📚 Documentation Guidelines**

## **📁 Documentation Directory**

All documentation must be placed under:

```
/docs
```

Each component, page, layout, federation module or architectural concept has its own Markdown file, organized as follows:

```
docs/
├── components/            # One file per component, grouped by family
│                          # (avatar, badge, button, card, dialog, field,
│                          #  link, loader, menu, panel, profile,
│                          #  smart-filter, table, tree…)
├── layouts/               # Layout components (e.g. BaseLayout)
├── modules/               # Federation page modules (e.g. GenericPageModule)
├── pages/                 # Generic pages (table, details, creation, edition, import)
├── design.md              # Design configuration
├── generic-pages.md       # Generic pages guide
├── i18n.md                # Translation keys
├── shared-ui-guidelines.md
├── shared-zones-guidelines.md
└── value-formatting.md    # Formatter / formatOptions configuration
```

---

# **🚀 Development**

This project uses **pnpm** as the package manager.

## **📦 Installation**

### ⭐ Quick Start

```sh
corepack enable
pnpm install
```

### Using pnpm manually

```sh
pnpm install
```

---

## **🛠️ Local Development**

### Start the dev server

```sh
pnpm dev
```

This starts the Vite dev server on port `5001`, serving the `LinPulsar` Module Federation remote and its exposed components.

### Build the library

```sh
pnpm build
```

### Run all checks

```sh
pnpm validate
```

### Type checking

```sh
pnpm typecheck
```

### Testing

Unit tests live in the `tests/` folder and mirror the `src/` structure (components, composables, federation, layouts, pages, services).

```sh
pnpm test          # Runs the full test suite once
pnpm test:watch    # Runs tests in watch mode
pnpm test:coverage # Generates a coverage report
```

### Lint & Format

```sh
pnpm lint
pnpm lint:fix

pnpm format
pnpm format:check
```

---

# **🧼 Code Quality**

We enforce strict quality standards via:

- **ESLint**
- **Prettier**
- **TypeScript**

Use:

```sh
pnpm validate
```

to run **all checks** at once.

## Copyright Headers

All TypeScript, JavaScript and Vue files must contain a copyright header at the beginning of the file (test and configuration files are exempt). This header is based on the content of the `COPYRIGHT` file at the project root.

### Affected Files

Copyright headers are mandatory for the following files:

- TypeScript files (`.ts`)
- JavaScript files (`.js`)
- Vue files (`.vue`)

### Automatic Verification

An ESLint rule is configured via the `eslint-plugin-headers` plugin to check for the presence of these headers.

### Automatic Header Addition

If a file does not contain the required copyright header, you can add it automatically by running:

```bash
pnpm lint:fix
```

This command will analyze all linted files and add missing headers according to the `COPYRIGHT` file.

### Manual Verification

To check compliance without modifying files, use:

```bash
pnpm lint
```

Any file without the appropriate header will be reported as a lint error.

---

# **🧪 E2E & Integration Testing**

Dedicated E2E suite will come later.

➡ **Coming soon… ⏳**

---

# **🚀 Releases (standard-version)**

Releases are automated with **standard-version**: when changes are merged into `main`, the CI (`.github/workflows/release.yml`) takes over.

When merging into `main`:

- The `package.json` version is bumped based on **commit types** (`feat` → minor, `fix` → patch, breaking change → major)
- The `CHANGELOG.md` file is generated
- A git tag `vX.Y.Z` is created and pushed
- The Docker image is built from the new tag and published to Docker Hub as `linagora/lin-pulsar:latest` and `linagora/lin-pulsar:<version>`

⚠ **No manual versioning is allowed.**

---

# **📜 License**

This project is distributed under the
**GNU Affero General Public License v3**.

See: [`LICENSE.md`](LICENSE.md) for details.
