import { expect } from "chai";
import { EMAIL_REGEX, formatAsList, formatLocalLink, headerFromFileName, highestLevelDir, isLocalUrl, removeFileExtension, standardizeFileName, traverseDirs, wikiURL } from "../src/utils.js";
import sinon from "sinon";
import ac from "@actions/core";

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
		let extensions = [".md", ".markdown"];
		it("is another file being made into a wiki page", () => {
			expect(formatLocalLink("FILE_NAME1.md", repo, "path/to", extensions, false)).
				to.equal("/owner/repo/wiki/file-name1");
			expect(formatLocalLink("FILE NAME2.markdown", repo, "path/to", extensions, false))
				.to.equal("/owner/repo/wiki/file-name2");
			expect(formatLocalLink("FILE_NAME3.md", repo, "path/to", extensions, true))
				.to.equal("/owner/repo/wiki/path|to|file-name3");
			expect(formatLocalLink("../FILE NAME4.markdown", repo, "path/to/", extensions, true))
				.to.equal("/owner/repo/wiki/path|file-name4");
		});
		it("is in wiki dir, but not a wiki page", () => {
			expect(formatLocalLink("FILE_NAME.png", repo, "path/to/", extensions, false))
				.to.equal("/owner/repo/blob/main/path/to/FILE_NAME.png");
			expect(formatLocalLink("../FILE_NAME.png", repo, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/main/path/FILE_NAME.png");
		});
		it("is in the repo", () => {
			expect(formatLocalLink("../../src/index.ts", repo, "path/to", extensions, false))
				.to.equal("/owner/repo/blob/main/src/index.ts");
			expect(formatLocalLink("../../src/index.ts", repo, "path/to", extensions, true))
				.to.equal("/owner/repo/blob/main/src/index.ts");
		});
		it("is local but not in the project directory", () => {
			const warningStub = sinon.stub(ac, "warning");
			expect(formatLocalLink("../../../file.md", repo, "path/to", extensions, false))
				.to.equal("../../../file.md");
			expect(warningStub.calledOnce).to.be.true;
			expect(warningStub.calledWith("[WARN] ../../../file.md is not in the project directory, leaving as is."))
				.to.be.true;
			expect(formatLocalLink("../../../outside/file.ts", repo, "path/to", extensions, true))
				.to.equal("../../../outside/file.ts");
			expect(warningStub.calledTwice).to.be.true;
			expect(warningStub.calledWith("[WARN] ../../../outside/file.ts is not in the project directory, leaving as is."))
				.to.be.true;
		});
		it("is an external url", () => {
			expect(formatLocalLink("https://example.com/image.png", repo, "path/to", extensions, false))
				.to.equal("https://example.com/image.png");
			expect(formatLocalLink("https://example.com/image.png", repo, "path/to", extensions, true))
				.to.equal("https://example.com/image.png");
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
	});

	it("removeFileExtension", () => {
		expect(removeFileExtension("file.md")).to.equal("file");
		expect(removeFileExtension("file")).to.equal("file");
		expect(removeFileExtension("file.test.ts")).to.equal("file.test");
		expect(removeFileExtension("")).to.equal("");
	});

	it("traverseDirs", () => {
		// expect(traverseDirs(contents, data, callback));
	});
});

import cp from "child_process";
console.log("############################################");
console.log(cp.execSync("pwd"));
console.log("############################################");