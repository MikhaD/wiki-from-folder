import { Dirent } from "fs";

export class File extends Dirent {
	/**
	 * A Dirent object for which isFile() returns true
	 * @param name - The name of the file
	 */
	constructor(public name: string) {
		super();
		this.name = name;
	}
	isFile(): boolean {
		return true;
	}
}

export class Dir extends Dirent {
	/**
	 * A Dirent object for which isDirectory() returns true
	 * @param name - The name of the directory
	 */
	constructor(public name: string) {
		super();
		this.name = name;
	}
	isDirectory(): boolean {
		return true;
	}
}


/** Reusable Dirent objects to make testing easier */
export const files = {
	sidebar: new File("_Sidebar.md"),
	footer: new File("_Footer.md"),
	home: new File("Home.md"),
	non_md_file: new File("NonMarkdown.txt"),
	md: [
		new File("file1.md"),
		new File("file2.md"),
		new File("file3.md"),
		new File("file4.md")
	],
	markdown: [
		new File("file1.markdown"),
		new File("file2.markdown"),
		new File("file3.markdown"),
		new File("file4.markdown")
	],
	non_md: [
		new File("Other_1.webp"),
		new File("Other_2.html"),
		new File("Other_3.png"),
		new File("Other_4.jpg")
	]
};