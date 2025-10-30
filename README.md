# Porter Diff

## Description

The Porter Diff tool is a CLI tool for generating GitHub diff URLs based on the tags of two different Porter apps in distinct clusters. It helps compare the changes between the two apps and provides a convenient way to view the differences on GitHub.

It has a very specific use case.
- Separate Porter clusters for staging and production
- Repo on Github
- All apps and repos are deployed from the same Github org

## Installation

To install the CLI package run the following command:

```
npm install porter-diff -g
```

## Requirements

### Porter CLI installed
https://docs.porter.run/cli/installation

```
brew install porter-dev/porter/porter
```
or 
```
/bin/bash -c "$(curl -fsSL https://install.porter.run)"
```

### Porter login
```
porter auth login
```
Used in my side project [Optogrid](https://www.optogrid.io)
