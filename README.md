# wiki-from-folder
This is a github action that creates a wiki from a folder of markdown files, with the option to include a custom sidebar.

by default the _Footer file is ignored when creating a custom sidebar.

## Nice to have
- Work with other types of files, not just markdown.
- choose whether or not to format file names
- option to generate index files for directories that have links to all the included files and sub indexes for subdirectories
- Prefix file names with directory path so the file `tests/iteration2/test.md` would be renamed `tests|iteration2|test.md`
- Option to add sections without titles to SidebarBuilder
- Option to choose which branch linked things should be linked to
