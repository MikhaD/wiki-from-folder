# wiki-from-folder
[![test coverage](https://mikhad.github.io/wiki-from-folder/badges/coverage.svg)](https://github.com/mikhad/wiki-from-folder/actions)

This is a github action that creates a wiki from a folder of markdown files, with the option to include a custom sidebar.

If there is a file named `_sidebar.md` in the root of the folder, it will be used as the sidebar. If there is no such file, the sidebar will be generated from the folder structure.

If you wish to have a custom footer, you can include a file named `_footer.md` in the root of the folder.

## Required features before 1.0
- Option to include the folders containing the documents to generate the wiki from as sections in the sidebar
- Need an ignore list: There is a possibility that a folder will contain a file named _sidebar.md, which should not be included in the sidebar, but will cause the empty folder to be included in the sidebar
- Tidy up readme

## Nice to have
- Option to include additional stuff at the top and bottom of the sidebar
- option to generate index files for directories that have links to all the included files and sub indexes for subdirectories
- Rework formatLinksInFile so it is less reliant on all the parameters of formatLocalLinks
- Add more async for reading and writing files
- Work with other types of files, not just markdown.

Need to get an access token for the wiki