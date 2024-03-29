# wiki-from-folder Action
![[Tests Passing](https://github.com/quicklysign/wiki-from-folder/actions/workflows/coverage.yml/badge.svg)](https://github.com/quicklysign/wiki-from-folder/actions/workflows/coverage.yml)

This is a github action that creates a wiki from one or more folders of markdown files, with the option to generate a custom sidebar from the directory structure of the source files.

## Features
More information about the features of this action can be found in the wiki under [feature examples](/quicklysign/wiki-from-folder/wiki/features).
1. ✅ Generates a GitHub wiki from one or more folders of markdown files.
1. ✅ Processes the markdown files to ensure that all relative links work correctly after converting to a wiki. See [here](/quicklysign/wiki-from-folder/wiki/link-processing) for more info.
1. ✅ Optionally generates a sidebar from the directory structure of the source files. Each folder will be a section in the sidebar, and each markdown file will be a link in the sidebar.
1. ✅ Optionally prefixes files with directory path in title. Because github wikis flatten directories into a single list of pages, this action provides the option to prefix the title of each page with the path to the file. This will make it easier to navigate the wiki, and prevent naming conflicts between files in different directories.
1. ✅ Provides the option to clear all existing pages from the wiki before generating the new pages. This is useful if you want to ensure that the wiki is only created from the source files. Any pages created in the GitHub wiki editor will be deleted.
1. ✅ Provides the option to append a warning comment to the top of the markdown of each wiki page it generates to let users know it was generated by an action and point them towards the source file to change if they want to edit that wiki page.

If there is a file named `_sidebar.md` in the root of the folder, it will be used as the sidebar unless you have selected to generate a custom sidebar.

If you wish to have a custom footer, you can include a file named `_footer.md` in the root of the folder.

## Usage
Add a wiki.yml file to your .github/workflows folder containing the following:
```yaml
name: Generate Wiki

on:
  push:
	branches: [ main ]
	paths:
	  - docs/**
	  - .github/workflows/wiki.yml

jobs:
  generate-wiki:
	runs-on: ubuntu-latest
	steps:
	- uses: actions/checkout@v4
	- uses: quicklysign/wiki-from-folder@main
	  with:
	#   These are the default values. You do not need to include them in your workflow file unless you want to change them.
		folders: 'docs'
		sidebar: true
		prefix-files-with-directory: false
		branch-to-link-to: main # This defaults to the default branch of the repository, which is usually main, but could be anything
		clear-wiki: false
		edit-warning: true
```

You can read more about the available options [here](/quicklysign/wiki-from-folder/wiki).

## Required features before 1.0
- Figure out if links to folders are treated correctly
- Make sure the directory path being turned into part of the title is processed properly (spaces, underscores, etc.)
- Option to include the folders containing the documents to generate the wiki from as sections in the sidebar
- Need an ignore list: There is a possibility that a folder will contain a file named _sidebar.md, which should not be included in the sidebar, but will cause the empty folder to be included in the sidebar
- Tidy up readme
- End to end tests (only run if the tests are running in the github action)


Need to get an access token for the wiki