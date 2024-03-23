# wiki-from-folder
[![test coverage](https://mikhad.github.io/wiki-from-folder/badges/coverage.svg)](https://github.com/mikhad/wiki-from-folder/actions)

This is a github action that creates a wiki from a folder of markdown files, with the option to include a custom sidebar.

If there is a file named `_sidebar.md` in the root of the folder, it will be used as the sidebar. If there is no such file, the sidebar will be generated from the folder structure.

If you wish to have a custom footer, you can include a file named `_footer.md` in the root of the folder.

## Nice to have
- Work with other types of files, not just markdown.
- option to generate index files for directories that have links to all the included files and sub indexes for subdirectories
- Option to choose which branch linked things should be linked to
- Account for home page
- Add more async for reading and writing files
- Keep folder structure intact when pushing to the wiki, as it doesn't matter to github
- Rework formatLinksInFile so it is less reliant on all the parameters of formatLocalLinks

Need to get an access token for the wiki