import { wikiURL } from "./utils.js";

export default class SidebarBuilder {
	public static readonly INDENT = "";

	private repo: string;
	private lines: string[];
	private sectionsOpen: number;

	/**
	 * A class to build a sidebar for a GitHub wiki.
	 * @param repo - The name of the repo the action is running in in the form `owner/repo`
	 * @param fileTypes - The list of file types to preprocess when linked to in the sidebar
	 * (including the .).
	 */
	constructor(repo: string) {
		this.repo = repo;
		this.lines = [];
		this.sectionsOpen = 0;
	}

	private get indent() {
		return SidebarBuilder.INDENT.repeat(this.sectionsOpen);
	}

	private addLine(line: string) {
		this.lines.push(this.indent + line);
	}

	private formatLink(title: string, fileToLinkTo: string): string {
		return `<a href="${wikiURL(fileToLinkTo, this.repo)}">${title}</a>`;
	}

	/**
	 * Open a new section in the sidebar.
	 * @param title The title of the section (details summary).
	 * @param bold - Whether to make the title bold.
	 */
	public openSection(title: string, bold: boolean): void;
	/**
	 * Open a new section in the sidebar which can be expanded or clicked to go to a file.
	 * @param title The title of the section (details summary).
	 * @param bold - Whether to make the title bold.
	 * @param fileToLinkTo - The file to link to when the section is clicked.
	 */
	public openSection(title: string, bold: boolean, fileToLinkTo: string): void
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

	/**
	 * Close the current section in the sidebar.
	 * @returns Whether a section was closed. If there are no sections open, this will return false.
	 */
	public closeSection(): boolean {
		if (this.sectionsOpen === 0) {
			return false;
		}
		this.sectionsOpen -= 1;
		this.addLine("</details>");
		return true;
	}

	/**
	 * Add a link to the given file to the sidebar.
	 * @param title - The title of the link (the thing that will be clicked on).
	 * @param fileToLinkTo - The name of the file to link to. It is assumed to be in the wiki.
	 */
	public addLink(title: string, fileToLinkTo: string): void {
		this.addLine(this.formatLink(title, fileToLinkTo) + "<br>");
	}

	/**
	 * Dump the sidebar to a string.
	 * @throws Error If there are still open sections when the sidebar is dumped.
	 */
	public dumps(): string {
		if (this.sectionsOpen > 0) {
			throw new Error("All sections must be closed before dumping the sidebar.");
		}
		return this.lines.join("\n");
	}
}