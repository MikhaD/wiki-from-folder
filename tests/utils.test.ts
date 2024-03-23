import { expect } from "chai";
import { EMAIL_REGEX, formatAsList, formatLinksInFile, formatLocalLink, headerFromFileName, highestLevelDir, isLocalUrl, parseDirectoryContents, StripName, standardizeFileName, traverseDirs, wikiURL } from "../src/utils.js";
import sinon from "sinon";
import fs from "fs";
import ac from "@actions/core";
import { DirectoryContents } from "../src/types.js";
import path from "path";

describe("utils.ts", () => {
	it("EMAIL_REGEX", () => {
		expect("bOb@b0b.bob").to.match(EMAIL_REGEX);
		expect("boB123_da+ma-n.3@B0b-43.B-0.b").to.match(EMAIL_REGEX);
		expect("bob@bob.bob ").not.to.match(EMAIL_REGEX);
		expect("bobbob.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob").not.to.match(EMAIL_REGEX);
		expect("bob@.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob.").not.to.match(EMAIL_REGEX);
		expect("@bob.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob!.bob").not.to.match(EMAIL_REGEX);
	});

	describe("isLocalUrl", () => {
		it("should return true for local urls", () => {
			expect(isLocalUrl("file:///C:/Users/username/Documents/")).to.be.true;
			expect(isLocalUrl("C:\\Users\\username\\Documents")).to.be.true;
			expect(isLocalUrl("/home/user/Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("./Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("../Documents/doc.pdf")).to.be.true;
		});
		it("should return false for remote urls", () => {
			expect(isLocalUrl("https://example.com")).to.be.false;
			expect(isLocalUrl("http://example.com")).to.be.false;
			expect(isLocalUrl("http://example.com/docs/file.md")).to.be.false;
			expect(isLocalUrl("https://example.com/docs/file.md")).to.be.false;
		});
	});

	describe("formatAsList", () => {
		it("empty", () => {
			expect(formatAsList("")).to.deep.equal([]);
			expect(formatAsList("      ")).to.deep.equal([]);
			expect(formatAsList(",,, ,")).to.deep.equal([]);
			expect(formatAsList("[]")).to.deep.equal([]);
			expect(formatAsList("[    ]")).to.deep.equal([]);
			expect(formatAsList("[,,, ,]")).to.deep.equal([]);
			expect(formatAsList("()")).to.deep.equal([]);
			expect(formatAsList("(    )")).to.deep.equal([]);
			expect(formatAsList("(,,, ,)")).to.deep.equal([]);
			expect(formatAsList("[)")).to.deep.equal([]);
			expect(formatAsList("(]")).to.deep.equal([]);
		});

		it("without brackets", () => {
			expect(formatAsList("this, that , the other ,")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("this,that,the other")).to.deep.equal(["this", "that", "the other"]);
		});

		it("with brackets", () => {
			expect(formatAsList("[ this, that , the other ,]")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("[this,that,the other]")).to.deep.equal(["this", "that", "the other"]);

			expect(formatAsList("( this, that , the other ,)")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("(this,that,the other)")).to.deep.equal(["this", "that", "the other"]);

			expect(formatAsList("( this, that , the other ,]")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("[this,that,the other)")).to.deep.equal(["this", "that", "the other"]);
		});
	});

	describe("standardizeFileName", () => {
		it("without a file path", () => {
			expect(standardizeFileName("file.md")).to.equal("file.md");
			expect(standardizeFileName("file name.md")).to.equal("file-name.md");
			expect(standardizeFileName("the_FILE-with The naMe.md")).to.equal("the-file-with-the-name.md");
		});

		it("with a file path", () => {
			expect(standardizeFileName("file.md", "path/to/THE/")).to.equal("path|to|the|file.md");
			expect(standardizeFileName("file name.md", "path/TO/the")).to.equal("path|to|the|file-name.md");
			expect(standardizeFileName("the_FILE-with The naMe.md", "Path/to")).to.equal("path|to|the-file-with-the-name.md");
		});
	});

	describe("formatLocalLink", () => {
		let repo = "owner/repo";
		let branch = "main";
		let extensions = [".md", ".markdown"];
		it("is another file being made into a wiki page", () => {
			expect(formatLocalLink("FILE_NAME1.md", repo, branch, "path/to", extensions, false)).
				to.equal("/owner/repo/wiki/file-name1");
			expect(formatLocalLink("FILE NAME2.markdown", repo, branch, "path/to", extensions, false))
				.to.equal("/owner/repo/wiki/file-name2");
			expect(formatLocalLink("../FILE NAME3.markdown", repo, branch, "path/to/", extensions, false))
				.to.equal("/owner/repo/wiki/file-name3");
			expect(formatLocalLink("more/dirs/FILE NAME4.markdown", repo, branch, "path/to/", extensions, false))
				.to.equal("/owner/repo/wiki/file-name4");
			expect(formatLocalLink("../more/dirs/FILE NAME5.markdown", repo, branch, "path/to/", extensions, false))
				.to.equal("/owner/repo/wiki/file-name5");
			expect(formatLocalLink("FILE_NAME6.md", repo, branch, "path/to", extensions, true))
				.to.equal("/owner/repo/wiki/path|to|file-name6");
			expect(formatLocalLink("../FILE NAME7.markdown", repo, branch, "path/to/", extensions, true))
				.to.equal("/owner/repo/wiki/path|file-name7");
			expect(formatLocalLink("more/dirs/FILE NAME8.markdown", repo, branch, "path/to/", extensions, true))
				.to.equal("/owner/repo/wiki/path|to|more|dirs|file-name8");
			expect(formatLocalLink("../more/dirs/FILE NAME9.markdown", repo, branch, "path/to/", extensions, true))
				.to.equal("/owner/repo/wiki/path|more|dirs|file-name9");
		});
		it("is in wiki dir, but not a wiki page", () => {
			expect(formatLocalLink("FILE_NAME.png", repo, branch, "path/to/", extensions, false))
				.to.equal("/owner/repo/blob/main/path/to/FILE_NAME.png");
			expect(formatLocalLink("../FILE_NAME.png", repo, branch, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/main/path/FILE_NAME.png");
		});
		it("is in the repo", () => {
			expect(formatLocalLink("../../src/index.ts", repo, branch, "path/to", extensions, false))
				.to.equal("/owner/repo/blob/main/src/index.ts");
			expect(formatLocalLink("../../src/index.ts", repo, branch, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/main/src/index.ts");
		});
		it("is local but not in the project directory", () => {
			const warningStub = sinon.stub(ac, "warning");
			expect(formatLocalLink("../../../file.md", repo, branch, "path/to", extensions, false))
				.to.equal("../../../file.md");
			expect(warningStub.calledOnce).to.be.true;
			expect(warningStub.calledWith("[WARN] ../../../file.md is not in the project directory, leaving as is."))
				.to.be.true;
			expect(formatLocalLink("../../../outside/file.ts", repo, branch, "path/to", extensions, true))
				.to.equal("../../../outside/file.ts");
			expect(warningStub.calledTwice).to.be.true;
			expect(warningStub.calledWith("[WARN] ../../../outside/file.ts is not in the project directory, leaving as is."))
				.to.be.true;
		});
		it("is an external url", () => {
			expect(formatLocalLink("https://example.com/image.png", repo, branch, "path/to", extensions, false))
				.to.equal("https://example.com/image.png");
			expect(formatLocalLink("https://example.com/image.png", repo, branch, "path/to", extensions, true))
				.to.equal("https://example.com/image.png");
		});
		it("Uses a different branch", () => {
			branch = "master";
			expect(formatLocalLink("FILE_NAME.png", repo, branch, "path/to/", extensions, false))
				.to.equal("/owner/repo/blob/master/path/to/FILE_NAME.png");
			expect(formatLocalLink("../FILE_NAME.png", repo, branch, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/master/path/FILE_NAME.png");
			expect(formatLocalLink("../../src/index.ts", repo, branch, "path/to", extensions, false))
				.to.equal("/owner/repo/blob/master/src/index.ts");
			expect(formatLocalLink("../../src/index.ts", repo, branch, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/master/src/index.ts");
		});
	});

	describe("formatLinksInFile", () => {
		let repo = "owner/repo";
		let currentDir = "path/to";
		let extensions = [".md", ".markdown"];

		describe("formats links", () => {
			const branch = "main";
			const text = `# Links

[Link to file 1](file1.md).
[Link to file 2](../file2.md).
[Link to file 3](../other/file3.md).
- [Link to file 4](doc/file4.markdown).
- [Link to file 5](../../file5.md).
- [Link to file 6](../../../file6.md).
- [Link to file 7](https://example.com/file7.md).
- [Link to file 8](images/image.png).
- [Link to file 9](../images/image.png).
- [Link to file 10](../../images/image.png).`;
			it("without prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, false)).to.equal(`# Links

[Link to file 1](/owner/repo/wiki/file1).
[Link to file 2](/owner/repo/wiki/file2).
[Link to file 3](/owner/repo/wiki/file3).

* [Link to file 4](/owner/repo/wiki/file4).
* [Link to file 5](/owner/repo/blob/main/file5.md).
* [Link to file 6](../../../file6.md).
* [Link to file 7](https://example.com/file7.md).
* [Link to file 8](/owner/repo/blob/main/path/to/images/image.png).
* [Link to file 9](/owner/repo/blob/main/path/images/image.png).
* [Link to file 10](/owner/repo/blob/main/images/image.png).
`);
			});
			it("with prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, true)).to.equal(`# Links

[Link to file 1](/owner/repo/wiki/path|to|file1).
[Link to file 2](/owner/repo/wiki/path|file2).
[Link to file 3](/owner/repo/wiki/path|other|file3).

* [Link to file 4](/owner/repo/wiki/path|to|doc|file4).
* [Link to file 5](/owner/repo/blob/main/file5.md).
* [Link to file 6](../../../file6.md).
* [Link to file 7](https://example.com/file7.md).
* [Link to file 8](/owner/repo/blob/main/path/to/images/image.png).
* [Link to file 9](/owner/repo/blob/main/path/images/image.png).
* [Link to file 10](/owner/repo/blob/main/images/image.png).
`);
			});
		});
		describe("formats images", () => {
			const branch = "master";
			const text = `# Links

![Image 1](file1.md).
![Image 2](../file2.md).
![Image 3](../other/file3.md).
- ![Image 4](doc/file4.markdown).
- ![Image 5](../../file5.md).
- ![Image 6](../../../file6.md).
- ![Image 7](https://example.com/file7.md).
- ![Image 8](images/image.png).
- ![Image 9](../images/image.png).
- [![Image 10](../images/image.png)](../../index.ts).
- ![Image 11](../../images/image.png).`;
			it("without prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, false)).to.equal(`# Links

![Image 1](/owner/repo/wiki/file1).
![Image 2](/owner/repo/wiki/file2).
![Image 3](/owner/repo/wiki/file3).

* ![Image 4](/owner/repo/wiki/file4).
* ![Image 5](/owner/repo/blob/master/file5.md).
* ![Image 6](../../../file6.md).
* ![Image 7](https://example.com/file7.md).
* ![Image 8](/owner/repo/blob/master/path/to/images/image.png).
* ![Image 9](/owner/repo/blob/master/path/images/image.png).
* [![Image 10](/owner/repo/blob/master/path/images/image.png)](/owner/repo/blob/master/index.ts).
* ![Image 11](/owner/repo/blob/master/images/image.png).
`);
			});
			it("with prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, true)).to.equal(`# Links

![Image 1](/owner/repo/wiki/path|to|file1).
![Image 2](/owner/repo/wiki/path|file2).
![Image 3](/owner/repo/wiki/path|other|file3).

* ![Image 4](/owner/repo/wiki/path|to|doc|file4).
* ![Image 5](/owner/repo/blob/master/file5.md).
* ![Image 6](../../../file6.md).
* ![Image 7](https://example.com/file7.md).
* ![Image 8](/owner/repo/blob/master/path/to/images/image.png).
* ![Image 9](/owner/repo/blob/master/path/images/image.png).
* [![Image 10](/owner/repo/blob/master/path/images/image.png)](/owner/repo/blob/master/index.ts).
* ![Image 11](/owner/repo/blob/master/images/image.png).
`);
			});
		});
		describe("formats definitions", () => {
			const branch = "dev";
			const text = `# Links

This is [some][def_1] markdown [text][def_2] that [is][def_3] going [to][def_4] have [a][def_5] ton
[of][def_6] definitions [in][def_7] it [to][def_8] test [my][def_9] definition [formatting][def_10].

[def_1]: file1.md
[def_2]: ../file2.md
[def_3]: ../other/file3.md "This is the title for def 3"
[def_4]: doc/file4.markdown
[def_5]: ../../file5.md "This is the title for def 5"
[def_6]: ../../../file6.md "This is the title for def 6"
[def_7]: https://example.com/file7.md "This is the title for def 7"
[def_8]: images/image.png
[def_9]: ../images/image.png "This is the title for def 9"
[def_10]: ../../images/image.png "This is the title for def 10"`;
			it("without prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, false)).to.equal(`# Links

This is [some][def_1] markdown [text][def_2] that [is][def_3] going [to][def_4] have [a][def_5] ton
[of][def_6] definitions [in][def_7] it [to][def_8] test [my][def_9] definition [formatting][def_10].

[def_1]: /owner/repo/wiki/file1\n
[def_2]: /owner/repo/wiki/file2\n
[def_3]: /owner/repo/wiki/file3 "This is the title for def 3"\n
[def_4]: /owner/repo/wiki/file4\n
[def_5]: /owner/repo/blob/dev/file5.md "This is the title for def 5"\n
[def_6]: ../../../file6.md "This is the title for def 6"\n
[def_7]: https://example.com/file7.md "This is the title for def 7"\n
[def_8]: /owner/repo/blob/dev/path/to/images/image.png\n
[def_9]: /owner/repo/blob/dev/path/images/image.png "This is the title for def 9"\n
[def_10]: /owner/repo/blob/dev/images/image.png "This is the title for def 10"\n`);
			});
			it("with prefixing", () => {
				expect(formatLinksInFile(text, repo, branch, currentDir, extensions, true)).to.equal(`# Links

This is [some][def_1] markdown [text][def_2] that [is][def_3] going [to][def_4] have [a][def_5] ton
[of][def_6] definitions [in][def_7] it [to][def_8] test [my][def_9] definition [formatting][def_10].

[def_1]: /owner/repo/wiki/path|to|file1\n
[def_2]: /owner/repo/wiki/path|file2\n
[def_3]: /owner/repo/wiki/path|other|file3 "This is the title for def 3"\n
[def_4]: /owner/repo/wiki/path|to|doc|file4\n
[def_5]: /owner/repo/blob/dev/file5.md "This is the title for def 5"\n
[def_6]: ../../../file6.md "This is the title for def 6"\n
[def_7]: https://example.com/file7.md "This is the title for def 7"\n
[def_8]: /owner/repo/blob/dev/path/to/images/image.png\n
[def_9]: /owner/repo/blob/dev/path/images/image.png "This is the title for def 9"\n
[def_10]: /owner/repo/blob/dev/images/image.png "This is the title for def 10"\n`);
			});
		});
	});

	it("headerFromFileName", () => {
		expect(headerFromFileName("file.md")).to.equal("File");
		expect(headerFromFileName("file name.md")).to.equal("File name");
		expect(headerFromFileName("the_full FILE-name.md")).to.equal("The full file name");
		expect(headerFromFileName("The other file name")).to.equal("The other file name");
	});

	it("highestLevelDir", () => {
		expect(highestLevelDir("path/to/file.md")).to.equal("path");
		expect(highestLevelDir("file.md")).to.equal(".");
		expect(highestLevelDir("/path/to/file.md")).to.equal("/");
		expect(highestLevelDir("../path/to/file.md")).to.equal("..");
	});

	it("wikiURL", () => {
		expect(wikiURL("file.md", "owner/repo")).to.equal("/owner/repo/wiki/file");
		expect(wikiURL("File Name.md", "/owner/repo")).to.equal("/owner/repo/wiki/file-name");
		expect(wikiURL("FILE_NAME", "/owner/repo/")).to.equal("/owner/repo/wiki/file-name");
		expect(wikiURL("main.test.ts", "/owner/repo/")).to.equal("/owner/repo/wiki/main.test");
		expect(wikiURL("../file.md", "/owner/repo/")).to.equal("/owner/repo/wiki/file");
	});

	it("StripName", () => {
		expect(StripName("file.md")).to.equal("file");
		expect(StripName("path/to/file.md")).to.equal("file");
		expect(StripName("file")).to.equal("file");
		expect(StripName("path/to/file")).to.equal("file");
		expect(StripName("file.test.ts")).to.equal("file.test");
		expect(StripName("path/file.test.ts")).to.equal("file.test");
		expect(StripName("")).to.equal("");
	});


	describe("traverseDirs", function() {
		it("run callback on each DirectoryContents", function() {
			let count = 0;
			const callback = () => count++;

			const contents: DirectoryContents = {
				path: "/",
				dirs: [
					{ path: "/subdir_1", dirs: [], files: [] },
					{ path: "/subdir_2", dirs: [], files: [] }
				],
				files: []
			};

			traverseDirs(contents, null, callback);
			expect(count).to.equal(3);
		});

		it("empty directory", function() {
			let count = 0;
			const callback = () => count++;

			const contents: DirectoryContents = {
				path: "/",
				dirs: [],
				files: []
			};
			traverseDirs(contents, null, callback);
			expect(count).to.equal(1);
		});

		it("nested directories", function() {
			let count = 0;
			const callback = () => count++;

			const contents: DirectoryContents = {
				path: "/",
				dirs: [
					{
						path: "/level_1",
						dirs: [
							{ path: "/level_1/level_2", dirs: [], files: [] }
						],
						files: []
					}
				],
				files: []
			};
			traverseDirs(contents, null, callback);
			expect(count).to.equal(3);
		});
	});

	describe("parseDirectoryContents", function() {
		let readdirSyncStub = sinon.stub(fs, "readdirSync");
		this.beforeEach(() => {
			readdirSyncStub.resetBehavior();
		});
		it("should return the correct directory structure", function() {
			const dir = "/test";
			const file = new fs.Dirent();
			file.name = "file1.md";
			file.isFile = () => true;

			readdirSyncStub.returns([file]);
			const result = parseDirectoryContents(dir);
			expect(result).to.deep.equal({
				path: dir,
				dirs: [],
				files: [file],
			});
		});

		it("should recurse into subdirectories", function() {
			const dir = "/test";
			const subDir = "/test/sub";
			const file1 = new fs.Dirent();
			file1.name = "file1.md";
			file1.isFile = () => true;
			const file2 = new fs.Dirent();
			file2.name = "file2.md";
			file2.isFile = () => true;
			const dir1 = new fs.Dirent();
			dir1.name = "sub";
			dir1.isDirectory = () => true;

			readdirSyncStub.withArgs(dir, { withFileTypes: true }).returns([dir1, file1, file2]);
			readdirSyncStub.withArgs(path.join(dir, dir1.name), { withFileTypes: true }).returns([file1, file2]);
			const result = parseDirectoryContents(dir);
			expect(result).to.deep.equal({
				path: dir,
				dirs: [{
					path: subDir,
					dirs: [],
					files: [file1, file2],
				}],
				files: [file1, file2],
			});
		});
	});
});