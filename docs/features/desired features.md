# Desired future features

### More fine grained clearing options
- Option to clear only the generated pages that are no longer in the source directory (should be default)
- Option to clear everything including files created by users elsewhere

### Front matter options
- Option to include front-matter in the markdown files to specify properties like the sidebar title etc. This will need to be removed or put in a different format once transformed into a wiki page because front matter becomes visible in wiki pages.

### PR Repo on changes to wiki
- Option to create pull request to main repo if there are documents that have been created using github's browser interface for creating wiki pages
	- See [gollum](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#gollum).
	- See https://github.com/Andrew-Chen-Wang/github-wiki-action/discussions/65

### Index files
- Option to generate index files for directories that have links to all the included files and sub indexes for subdirectories

### Better linking detection
- Add the ability to detect when a file links to another markdown file in any of the folders being published to the wiki

### Decorate sidebar
- Option to include additional stuff at the top and bottom of the sidebar

### Links to headings in files
- Option to enable generating links to the headings in the files so that files themselves are closed details sections in the sidebar

## Refactoring
- Rework formatLinksInFile so it is less reliant on all the parameters of formatLocalLinks
- Add more async for reading and writing files

## Closed list
- Option to include a list of directories that should always be closed in the sidebar regardless of the `sections-open-depth` setting

# Before the next version
- Figure out if links to folders are treated correctly
- Make sure the directory path being turned into part of the title is processed properly (spaces, underscores, etc.)
- Need an ignore list: There is a possibility that a folder will contain a file named _sidebar.md, which should not be included in the sidebar, but will cause the empty folder to be included in the sidebar
- Tidy up readme
- End to end tests (only run if the tests are running in the github action)