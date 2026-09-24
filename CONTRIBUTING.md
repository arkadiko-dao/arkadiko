# Contributing to Arkadiko

Thank you for your interest in contributing to Arkadiko! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Style Guidelines](#style-guidelines)
- [Security](#security)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be considerate in your interactions with other contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/arkadiko.git
   cd arkadiko
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/arkadiko-dao/arkadiko.git
   ```

## How to Contribute

### Types of Contributions

- **Bug fixes**: Help us squash bugs in the smart contracts or web interface
- **Documentation**: Improve or add documentation
- **Feature development**: Implement new features (please discuss first)
- **Testing**: Add or improve test coverage
- **Code review**: Review pull requests from other contributors

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Yarn](https://yarnpkg.com/)
- [Clarinet](https://github.com/hirosystems/clarinet) for Clarity smart contract development

### Smart Contracts (Clarity)

1. Install Clarinet:
   ```bash
   # macOS
   brew install clarinet
   
   # Or download from GitHub releases
   ```

2. Navigate to the clarity folder:
   ```bash
   cd clarity
   ```

3. Run tests:
   ```bash
   clarinet test
   ```

4. Check contracts:
   ```bash
   clarinet check
   ```

### Web Application

1. Navigate to the web folder:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   yarn dev
   ```

## Pull Request Process

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** and commit with clear messages:
   ```bash
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue with X"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** against the `master` branch

5. **Ensure your PR**:
   - Has a clear title and description
   - References any related issues
   - Passes all tests
   - Follows the project's style guidelines

## Reporting Bugs

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs. **actual behavior**
- **Environment details** (browser, OS, wallet, etc.)
- **Screenshots or logs** if applicable

Use the [GitHub Issues](https://github.com/arkadiko-dao/arkadiko/issues) to report bugs.

## Suggesting Features

For feature suggestions:

1. Check existing issues to avoid duplicates
2. Open a new issue with the `enhancement` label
3. Clearly describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Any alternatives you've considered

## Style Guidelines

### Clarity Smart Contracts

- Use descriptive function and variable names
- Add comments for complex logic
- Follow existing code patterns in the repository
- Include appropriate error constants with descriptive names
- Use `contract-caller` for authorization checks (not `tx-sender` for sensitive operations)

### TypeScript/JavaScript (Web)

- Follow the existing ESLint configuration
- Use TypeScript for type safety
- Format code with Prettier before committing:
  ```bash
  yarn lint:fix
  yarn lint:prettier:fix
  ```

### Commit Messages

Follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `chore:` for maintenance tasks

## Security

**Please do not report security vulnerabilities through public GitHub issues.**

For security issues, please refer to our [SECURITY.md](SECURITY.md) file and contact the team at security@arkadiko.finance.

## Questions?

If you have questions, feel free to:
- Open a discussion on GitHub
- Reach out on [Twitter](https://twitter.com/ArkadikoFinance)
- Check the [documentation](https://docs.arkadiko.finance)

---

Thank you for contributing to Arkadiko! 🙏
