import path from "path";

export default class SidebarBuilder {
	public static readonly INDENT = "\t";

	readonly #repo: string;
	private lines: string[];
	private sectionsOpen: number;
	private fileTypes: string[];

	/**
	 * A class to build a sidebar for a GitHub wiki.
	 * @param repo - The name of the repo the action is running in in the form `owner/repo`
	 * @param fileTypes - The list of file types to preprocess when linked to in the sidebar
	 * (including the .).
	 */
	constructor(repo: string, fileTypes: string[]) {
		if (repo.endsWith("wiki") || repo.endsWith("wiki/")) {
			this.#repo = repo;
		} else {
			this.#repo = path.join(repo, "wiki");
		}
		this.fileTypes = fileTypes;
		this.lines = [];
		this.sectionsOpen = 0;
	}

	public get repo(): string {
		return this.#repo;
	}

	private get indent() {
		return SidebarBuilder.INDENT.repeat(this.sectionsOpen);
	}

	private addLine(line: string) {
		this.lines.push(this.indent + line);
	}

	private formatLink(title: string, fileToLinkTo: string): string {
		const extension = path.extname(fileToLinkTo);
		if (this.fileTypes.includes(extension)) {
			fileToLinkTo = fileToLinkTo.slice(0, -extension.length);
		}
		return `<a href="${path.join(this.#repo, fileToLinkTo)}">${title}</a>`;
	}

	public openSection(title: string, bold: boolean, fileToLinkTo?: string) {
		this.addLine("<details>");
		this.sectionsOpen += 1;
		if (bold) {
			title = `<strong>${title}</strong>`;
		}
		if (fileToLinkTo) {
			title = this.formatLink(title, fileToLinkTo);
		}
		this.addLine(`<summary>${title}</summary>`);
		// GFM requires a blank line after the summary in order for MD syntax to work in details
		this.addLine("");
	}

	public closeSection(): boolean {
		if (this.sectionsOpen === 0) {
			return false;
		}
		this.sectionsOpen -= 1;
		this.addLine("</details>");
		return true;
	}

	public addLink(title: string, fileToLinkTo: string): void {
		this.addLine(this.formatLink(title, fileToLinkTo) + "<br>");
	}

	public dumps(): string {
		if (this.sectionsOpen > 0) {
			throw new Error("All sections must be closed before dumping the sidebar.");
		}
		return this.lines.join("\n");
	}
}