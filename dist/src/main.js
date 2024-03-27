import ac from "@actions/core";
import * as utils from "./utils.js";
import * as gh from "./git_helpers.js";
import fs from "fs";
import SidebarBuilder from "./SidebarBuilder.js";
import path from "path";
/**
 * The main function, executed in index.ts, exported to make it testable.
 * @param repo - The repo the action is running in in the format `owner/repo`.
 */
export default async function main(inputs) {
    try {
        const tempDir = `../wiki-working-directory-${Date.now()}`;
        const wiki = gh.cloneWiki(inputs.repo, tempDir, inputs.clearWiki);
        let contents = {
            path: "",
            totalFiles: 0,
            dirs: [],
            files: [],
        };
        if (inputs.folders.length > 1) {
            for (const dir of inputs.folders) {
                const dc = utils.parseDirectoryContents(dir, inputs.sidebarFileTypes);
                contents.totalFiles += dc.totalFiles;
                contents.dirs.push(dc);
            }
        }
        else {
            contents = utils.parseDirectoryContents(inputs.folders[0], inputs.sidebarFileTypes);
        }
        // Don't make the folder containing the docs a section in the sidebar
        contents.path = "";
        await wiki; // wait for the wiki to clone
        if (inputs.sidebar) {
            const sb = processFiles(contents, tempDir, inputs, true);
            fs.writeFileSync(path.join(tempDir, "_Sidebar.md"), sb.dumps());
        }
        else {
            processFiles(contents, tempDir, inputs, false);
        }
        // clone the wiki repo
        process.chdir(tempDir);
        gh.configureGit();
        gh.commitAndPush(["."], ":memo: updated wiki");
    }
    catch (e) {
        ac.error(e);
        ac.setFailed("Action failed");
    }
}
export function processFiles(dir, tempDir, inputs, sidebar) {
    if (sidebar) {
        return __processFiles(dir, tempDir, inputs, new SidebarBuilder(inputs.repo, inputs.editWarning));
    }
    return __processFiles(dir, tempDir, inputs);
}
function __processFiles(dir, tempDir, inputs, sb) {
    if (sb && dir.path && dir.totalFiles > 0) {
        sb.openSection(path.basename(dir.path), true);
    }
    for (const file of dir.files) {
        const formattedFileName = utils.standardizeFileName(file.name, inputs.prefixFilesWithDir ? dir.path : undefined);
        const fullPath = path.join(dir.path, file.name);
        if (["_Sidebar.md", "_Footer.md"].includes(file.name)) {
            if (file.name === "_Sidebar.md" && sb) {
                ac.warning("Found existing _Sidebar.md, overwriting. Set `sidebar` to false to prevent this.");
            }
            else {
                ac.info(`Found existing ${file.name}`);
            }
            fs.copyFileSync(fullPath, path.join(tempDir, file.name));
        }
        else {
            const text = fs.readFileSync(fullPath, "utf8");
            let fileContents = utils.formatLinksInFile(text, inputs.repo, inputs.branchToLinkTo, dir.path, inputs.sidebarFileTypes, inputs.prefixFilesWithDir);
            if (inputs.editWarning) {
                fileContents = utils.createEditWarning(fullPath) + "\n" + fileContents;
            }
            fs.writeFileSync(path.join(tempDir, "generated", formattedFileName), fileContents);
            if (sb) {
                sb.addLink(utils.headerFromFileName(file.name), formattedFileName);
            }
        }
    }
    for (const sub_dir of dir.dirs) {
        if (sb) {
            sb = __processFiles(sub_dir, tempDir, inputs, sb);
        }
        else {
            sb = __processFiles(sub_dir, tempDir, inputs);
        }
    }
    if (sb && dir.path && dir.totalFiles > 0) {
        sb.closeSection();
    }
    return sb;
}
