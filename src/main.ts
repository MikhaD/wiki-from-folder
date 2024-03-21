import { setFailed, info, getBooleanInput, getInput } from "@actions/core";
import { parseDirectoryContents, formatAsList, headerFromFileName, standardizeFileName, formatLinksInFile, traverseDirs, wikiURL } from "./utils.js";
import { commitAndPush, configureGit, cloneWiki } from "./git_helpers.js";
import { DirectoryContents } from "./types";
import fs from "fs";

import SidebarBuilder from "./SidebarBuilder";
import path from "path";

/** The name of the repo the action is running in in the form `owner/repo` */
const repoName = process.env.GITHUB_REPOSITORY!;

/** The main function, executed in index.ts, exported to make it testable */
export default async function main() {
	try {
		const inputs = {
			"directories": formatAsList(getInput("directories")),
			"sidebar": getBooleanInput("sidebar"),
			"prefixFilesWithDir": getBooleanInput("prefix-files-with-directory"),
			"sidebarFileTypes": formatAsList(getInput("sidebar-file-types")).map((s) => {
				if (!s.startsWith(".")) s = `.${s}`;
				return s.toLowerCase();
			}),
			"branchToLinkTo": getInput("branch-to-link-to"),
			"clearWiki": getBooleanInput("clear-wiki"),
		};

		const tempDir = `wiki-working-directory-${Date.now()}`;
		const wiki = cloneWiki(repoName, tempDir, inputs.clearWiki);

		let contents: DirectoryContents = {
			path: inputs.directories[0],
			dirs: [],
			files: [],
		};

		if (inputs.directories.length > 1) {
			contents.path = "";
			for (const dir of inputs.directories) {
				contents.dirs.push(parseDirectoryContents(dir, inputs.sidebarFileTypes));
			}
		} else {
			contents = parseDirectoryContents(inputs.directories[0], inputs.sidebarFileTypes);
		}

		const data: Data = {
			sidebarBuilder: new SidebarBuilder(repoName, inputs.sidebarFileTypes),
			tempDir: tempDir,
			repo: repoName,
			...inputs,
		};

		await wiki; // wait for the wiki to clone

		traverseDirs(contents, data, onEachDir);
		// must be data.sidebar not inputs.sidebar because if it was true but there was already a
		// sidebar file it will be set to false
		if (data.sidebar) {
			fs.writeFileSync(path.join(tempDir, "_Sidebar.md"), data.sidebarBuilder.dumps());
		}

		// clone the wiki repo
		configureGit();
		process.chdir(tempDir);
		commitAndPush(["."], ":memo: updated wiki");
	} catch (e) {
		info(e as string);
		setFailed("Action failed");
	}
}

type Data = {
	sidebarBuilder: SidebarBuilder;
	tempDir: string;
	repo: string;
	sidebar: boolean;
	sidebarFileTypes: string[];
	prefixFilesWithDir: boolean;
};

export function onEachDir(dir: DirectoryContents, data: Data) {
	const numWikiFiles = dir.files.reduce((count, file) => count + +data.sidebarFileTypes.includes(path.extname(file.name)), 0);
	if (data.sidebar && dir.path && numWikiFiles > 0) {
		data.sidebarBuilder.openSection(path.basename(dir.path), true);
	}
	for (const file of dir.files) {
		const formattedFileName = standardizeFileName(file.name, data.prefixFilesWithDir ? dir.path : undefined);
		if (dir.path.length > 0 && (file.name === "_Sidebar.md" || file.name === "_Footer.md")) {
			if (file.name === "_Sidebar.md") data.sidebar = false;
			info(`Found existing ${file.name}`);
			fs.copyFileSync(path.join(dir.path, file.name), path.join(data.tempDir, file.name));
			continue;
		}
		if (data.sidebarFileTypes.includes(path.extname(file.name).toLowerCase())) {
			const text = fs.readFileSync(path.join(dir.path, file.name), "utf8");
			const fileContents = formatLinksInFile(text, repoName, dir.path, data.sidebarFileTypes, data.prefixFilesWithDir);
			fs.writeFileSync(path.join(data.tempDir, formattedFileName), fileContents);
			if (data.sidebar) {
				data.sidebarBuilder.addLink(headerFromFileName(file.name), formattedFileName);
			}
		} else {
			fs.copyFileSync(path.join(dir.path, file.name), path.join(data.tempDir, formattedFileName));
		}

		if (data.sidebar && numWikiFiles > 0) {
			data.sidebarBuilder.addLink(headerFromFileName(file.name), wikiURL(formattedFileName, data.repo));
		}
	}
	if (data.sidebar && dir.path) {
		data.sidebarBuilder.closeSection();
	}
}