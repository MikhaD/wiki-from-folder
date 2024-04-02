import ac from "@actions/core";
import exec from "@actions/exec";
import * as utils from "./utils.js";
import * as gh from "./git_helpers.js";
import { DirectoryContents, MainInputs } from "./types";
import fs from "fs";

import SidebarBuilder from "./SidebarBuilder.js";
import path from "path";


/**
 * The main function, executed in index.ts, exported to make it testable.
 * @param repo - The repo the action is running in in the format `owner/repo`.
 */
export default async function main(inputs: MainInputs) {
	try {
		const tempDir = `../wiki-working-directory-${Date.now()}`;

		const wiki = gh.cloneWiki(inputs.repo, inputs.host, tempDir);

		let contents: DirectoryContents = {
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
		} else {
			contents = utils.parseDirectoryContents(inputs.folders[0], inputs.sidebarFileTypes);
		}
		// Don't make the folder containing the docs a section in the sidebar
		// contents.path = "";

		await wiki; // wait for the wiki to clone

		if (inputs.clearWiki) {
			await exec.exec("rm", ["-r", path.join(tempDir, "*")]);
		}
		// Create the directory for the generated files if it doesn't exist
		fs.mkdirSync(path.join(tempDir, inputs.generatedFilesDir), { recursive: true });

		if (inputs.sidebar) {
			const sb = processFiles(contents, tempDir, inputs, true);
			fs.writeFileSync(path.join(tempDir, "_Sidebar.md"), sb.dumps());
		} else {
			processFiles(contents, tempDir, inputs, false);
		}

		process.chdir(tempDir);
		gh.configureGit();
		gh.commitAndPush(["."], ":memo: updated wiki");
	} catch (e) {
		ac.error(e as string);
		ac.setFailed("Action failed");
	}
}

/**
 * Recurse through the directory structure, processing the links in each file and copying them to
 * the temp directory if they are specified as wiki files.
 * @param dir - The DirectoryContents object to recursively process.
 * @param tempDir - The temporary directory to copy the files to.
 * @param inputs - The inputs to the action.
 * @param sb - Whether to build and return a sidebar.
 */
export function processFiles(dir: DirectoryContents, tempDir: string, inputs: MainInputs, sidebar: false): undefined;
/**
 * Recurse through the directory structure, processing the links in each file and copying them to
 * the temp directory if they are specified as wiki files. Each wiki file will be added to the
 * sidebar.
 * @param dir - The DirectoryContents object to recursively process.
 * @param tempDir - The temporary directory to copy the files to.
 * @param inputs - The inputs to the action.
 * @param sb - Whether to build and return a sidebar.
 *
 * @returns A SidebarBuilder object containing the sidebar links.
 */
export function processFiles(dir: DirectoryContents, tempDir: string, inputs: MainInputs, sidebar: true): SidebarBuilder;
export function processFiles(dir: DirectoryContents, tempDir: string, inputs: MainInputs, sidebar: boolean): SidebarBuilder | undefined {
	if (sidebar) {
		return __processFiles(dir, tempDir, inputs, new SidebarBuilder(inputs.repo, inputs.editWarning));
	}
	return __processFiles(dir, tempDir, inputs);
}

function __processFiles(dir: DirectoryContents, tempDir: string, inputs: MainInputs, sb?: SidebarBuilder) {
	if (sb && dir.path && dir.totalFiles > 0) {
		sb.openSection(path.basename(dir.path), true);
	}
	for (const file of dir.files) {
		const formattedFileName = utils.standardizeFileName(file.name, inputs.prefixFilesWithDir ? dir.path : undefined);
		const fullPath = path.join(dir.path, file.name);
		if (["_Sidebar.md", "_Footer.md"].includes(file.name)) {
			if (file.name === "_Sidebar.md" && sb) {
				ac.warning("Found existing _Sidebar.md, overwriting. Set `sidebar` to false to prevent this.");
			} else {
				ac.info(`Found existing ${file.name}`);
			}
			fs.copyFileSync(fullPath, path.join(tempDir, file.name));
		} else {
			ac.info(`working directory: ${process.cwd()}`);
			ac.info(fs.readdirSync(".").join(" "));
			exec.exec("ls", ["-l"]);
			ac.info(fullPath);
			const text = fs.readFileSync(fullPath, "utf8");
			let fileContents = utils.formatLinksInFile(text, inputs.repo, inputs.branchToLinkTo, dir.path, inputs.sidebarFileTypes, inputs.prefixFilesWithDir);
			if (inputs.editWarning) {
				fileContents = utils.createEditWarning(fullPath) + "\n" + fileContents;
			}
			fs.writeFileSync(path.join(tempDir, inputs.generatedFilesDir, formattedFileName), fileContents);
			if (sb) {
				sb.addLink(utils.headerFromFileName(file.name), formattedFileName);
			}
		}
	}
	for (const sub_dir of dir.dirs) {
		if (sb) {
			sb = __processFiles(sub_dir, tempDir, inputs, sb);
		} else {
			sb = __processFiles(sub_dir, tempDir, inputs);
		}
	}
	if (sb && dir.path && dir.totalFiles > 0) {
		sb.closeSection();
	}
	return sb;
}