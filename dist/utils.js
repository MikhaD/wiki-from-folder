import path from "path";
import fs from "fs";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { visit } from "unist-util-visit";
import ac from "@actions/core";
/** Match a valid email address */
export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/m;
/**
 * Convert a string containing a list of comma separated values, optionally enclosed in brackets or
 * square brackets to a list of strings.
 * @param s The string to parse
 */
export function formatAsList(str) {
    let s = str.trim();
    s = s.replace(/^[\[(]|[\])]$/gm, "");
    if (s === "")
        return [];
    let items = s.split(",").map((s) => s.trim()).filter(s => s !== "");
    return items;
}
/**
 * Take a directory path and return a DirectoryContents object containing the path, a list of
 * subdirectories as DirectoryContents objects, and a list of files that match the provided
 * extensions as Dirent objects.
 * @param dir - The path to the directory to parse
 * @param extensions - A list of file extensions to be considered files.
 */
export function parseDirectoryContents(dir, extensions) {
    const data = fs.readdirSync(dir, { withFileTypes: true });
    const contents = {
        path: dir,
        totalFiles: 0,
        dirs: [],
        files: [],
    };
    for (const file of data) {
        if (file.isDirectory()) {
            contents.dirs.push(parseDirectoryContents(path.join(dir, file.name), extensions));
        }
        else if (file.isFile() && extensions.includes(path.extname(file.name))) {
            contents.files.push(file);
        }
    }
    for (const d of contents.dirs) {
        contents.totalFiles += d.totalFiles;
    }
    contents.totalFiles += contents.files.length;
    return contents;
}
/**
 * Return a file or file path's base name without the extension. If it has multiple extensions, such
 * as `main.test.ts` only the last one will be removed.
 * @param name - The file name to remove the extension from.
 */
export function StripName(name) {
    name = path.basename(name);
    if (path.extname(name).length > 0) {
        name = name.slice(0, -path.extname(name).length);
    }
    return name;
}
/**
 * Format a file name as a easy to read header by replacing underscores and hyphens with spaces,
 * capitalizing the first letter, and removing the file extension.
 * @param name - The file name to format as a header.
 */
export function headerFromFileName(name) {
    name = name.replace(/[-_]/g, " ");
    name = StripName(name);
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
/**
 * Standardize a file name by replacing spaces and underscores with hyphens and converting it to
 * lowercase.
 * @param name - The file name to standardize.
 * @param file_path - The path to the file to standardize. If specified, the file name will be
 * joined to the path using a pipe character. The result will look like `path|to|file-name.md`.
 */
export function standardizeFileName(name, file_path) {
    name = name.replace(/ |_|(%20)/g, "-");
    if (file_path) {
        name = path.join(file_path, name);
        name = name.replace(/\//g, "|");
    }
    return name.toLowerCase();
}
/**
 * Determine if a URL is a local file path or a web URL.
 * @param url - The URL string to check.
 */
export function isLocalUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // if it is a file link || a windows absolute path
        return parsedUrl.protocol.startsWith("file") || parsedUrl.protocol.length <= 2;
    }
    catch (e) {
        return true;
    }
}
/**
 * Determine the highest level directory in a file path.
 * @param file - The file path to find the highest level directory of.
 */
export function highestLevelDir(file) {
    let result = path.normalize(file).split(path.sep).shift();
    if (result === file) {
        result = ".";
    }
    if (result === "") {
        result = "/";
    }
    return result;
}
/**
 * Format a link to a local file to work with github wikis. If the file is in one of the folders
 * that the wiki is being generated from, and is one of the file types being turned into wiki pages,
 * the link will be formatted as a wiki link. If it is not one of the file types being turned into
 * wiki pages, or is in the repo but not in one of the folders the wiki is being generated from, the
 * link will be formatted as a link to the file in the repo. If the file is not in the repo, the
 * link will be left as is.
 * @param link - The link to format.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 * @param currentDir - The current directory of the file being formatted.
 * @param extensions - A list of file extensions to be be considered wiki files (linked to the wiki instead of the repo).
 * @param prefixWithDir - Whether to prefix the file name being linked to with the directory it is in.
 */
export function formatLocalLink(link, repo, branchToLinkTo, currentDir, extensions, prefixWithDir) {
    if (isLocalUrl(link)) {
        const newPath = path.join(currentDir, link);
        if (highestLevelDir(newPath) === highestLevelDir(currentDir)) {
            // let fileName = path.basename(url);
            // This is a link to another wiki page
            if (extensions.includes(path.extname(link))) {
                currentDir = path.join(currentDir, path.dirname(link));
                let file = path.basename(link);
                file = standardizeFileName(file, prefixWithDir ? currentDir : undefined);
                return wikiURL(file, repo);
            }
            // This is in the dir the wiki is being generated from, but not a wiki page
            return path.join("/", repo, "blob", branchToLinkTo, newPath);
        }
        if (newPath.startsWith("../")) {
            // this links to something outside the project directory
            ac.warning(`[WARN] ${link} is not in the project directory, leaving as is.`);
        }
        else {
            // This is in the repo itself
            return path.join("/", repo, "blob", branchToLinkTo, newPath);
        }
    }
    // this is an external url to a web resource or something else
    return link;
}
/**
 * Open the markdown file at the given path, parse it, and prefix all local links with
 * owner/repo/wiki so they work with github wikis, and change all linked file names to match the
 * formatted file names.
 * @param path - The path to the markdown file to format.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 * @param currentDir - The current directory of the file being formatted.
 * @param extensions - A list of file extensions to be be considered wiki files (linked to the wiki instead of the repo).
 * @param prefixFileWithDir - Whether to prefix the file name with the directory it is in.
 */
export function formatLinksInFile(text, repo, branchToLinkTo, currentDir, extensions, prefixFileWithDir) {
    const tree = fromMarkdown(text);
    visit(tree, ["image", "link", "definition"], function (node) {
        node = node;
        node.url = formatLocalLink(node.url, repo, branchToLinkTo, currentDir, extensions, prefixFileWithDir);
    });
    return toMarkdown(tree);
}
/**
 * Generate a local wiki URL for a file in the repo.
 * @param fileName - The name of the file to generate a URL for. It will be standardized.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 */
export function wikiURL(fileName, repo) {
    return path.join("/", repo, "wiki", StripName(standardizeFileName(fileName)));
}
/**
 * Create a warning message to go at the top of a file that is generated by the action to inform the
 * viewer that the file is generated and should not be edited.
 * @param path - The path to the file the wiki file was generated from to direct the user to. If not
 * specified the user will not be directed to a source file.
 */
export function createEditWarning(path) {
    const lines = [
        "🛑 DO NOT EDIT THIS FILE ON GITHUB 🛑",
        "This file will be overwritten the next time the wiki is regenerated",
    ];
    if (path) {
        lines.push(`Edit the source in ${path} to change this file`);
    }
    const maxLength = lines.reduce((max, line) => Math.max(line.length, max), 0) + 2;
    const border = "-".repeat(maxLength);
    lines.unshift(border);
    lines.push(border);
    return lines.map((line) => `<!--${centerText(line, maxLength)}-->`).join("\n") + "\n";
}
/**
 * Center a string in a string of a given width, filling the remaining space with a specified fill
 * character. If the string is longer than the width, it will be returned as is. If
 * `width - text.length` is odd, the extra character will be added to the right side.
 * @param width - The width of the string to center the text in.
 * @param text - The text to center.
 * @param fill - The character to fill the remaining space with. If the length of the
 * fill string is greater than 1, only the first character will be used.
 */
export function centerText(text, width, fill = " ") {
    width = Math.max(0, width - text.length);
    fill = fill[0];
    const sideSize = Math.floor(width / 2);
    const padding = fill.repeat(sideSize);
    if (width % 2 === 1) {
        return padding + text + padding + fill;
    }
    return padding + text + padding;
}
