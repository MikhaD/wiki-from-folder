import path from "path";
import main from "./main.js";
import ac from "@actions/core";
import { formatSectionDepth } from "./utils.js";

const inputs = {
	folders: ac.getMultilineInput("folders").map(dir => path.join(dir, "/")),
	sidebar: ac.getBooleanInput("sidebar"),
	prefixFilesWithDir: ac.getBooleanInput("prefix-files-with-dir"),
	sidebarFileTypes: [".md", ".markdown"],
	branchToLinkTo: ac.getInput("branch-to-link-to"),
	clearWiki: ac.getBooleanInput("clear-wiki"),
	editWarning: ac.getBooleanInput("edit-warning"),
	host: ac.getInput("host"),
	repo: ac.getInput("repo")!,
	generatedFilesDir: ac.getInput("generated-files-dir"),
	makeSrcDirsSections: ac.getBooleanInput("make-src-dirs-sections"),
	sectionsOpenDepth: formatSectionDepth(ac.getInput("sections-open-depth"), !ac.getBooleanInput("make-src-dirs-sections")),
};

process.env.GH_TOKEN = ac.getInput("token");
main(inputs);
