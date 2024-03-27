This action parses all markdown files being converted into wiki pages and ensures all relative links, images and definitions are correctly formatted for the wiki. Below is a list of the types of links that are processed and how they are handled.

From this point on links, images and definitions will be referred to as links. The folder that the wiki is being generated from will be referred to as the wiki folder, or as the docs folder.

## Relative Links
### Other markdown files in the wiki folder
Links to other markdown files in the wiki folder are modified to link to the wiki page for that file. For example, the link `[Link to another file](File.md)` will be changed to `[Link to another file](/owner/repo/wiki/file)`.

### Non markdown files in the wiki folder
Links to non markdown files in the wiki folder are modified to link to the file on GitHub. For example, the image `[diagram](diagram.png)` will be changed to `[diagram](/owner/repo/blob/main/docs/File.txt)`, assuming that the wiki is being generated from the `docs` folder. The `branch-to-link-to` option determines which branch to link to when the file is not a wiki file or not in a wiki folder. it defaults to the repository's default branch.

### Other markdown files in subdirectories of the wiki folder
Links to other markdown files in subdirectories of the wiki folder are treated the same as links to other markdown files in the wiki folder.

As long as a link is to another markdown file somewhere within the folder being converted into a wiki, it will be modified to link to the wiki page for that file.
> LIMITATION
> Currently the action does not recognize links to a markdown file in a different top level folder also being converted into a wiki as wiki files.

### Files outside of the wiki folder
Relative links to files outside of the wiki folder are changed to point to the file in the repository instead. For example, the following link in a file in the docs folder `[index](../src/index.ts)` will be changed to `[index](/owner/repo/blob/main/src/index.ts)`.

### Files outside the repository
Relative links to files outside of the repository are left unchanged, and cause the action to print a warning message.

## Absolute Links
Links to internet resources are left unchanged.