import { nameof, SyntaxKind } from "@ts-morph/common";
import { expect } from "chai";
import { ImportEqualsDeclaration } from "../../../../compiler";
import { Project } from "../../../../Project";
import { getInfoFromText } from "../../testHelpers";

describe("ImportEqualsDeclaration", () => {
  describe(nameof<ImportEqualsDeclaration>("getName"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      expect(firstChild.getName()).to.equal(expected);
    }

    it("should get the name", () => {
      doTest("import test = Namespace.Test;", "test");
    });
  });

  describe(nameof<ImportEqualsDeclaration>("isTypeOnly"), () => {
    function doTest(text: string, expected: boolean) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      expect(firstChild.isTypeOnly()).to.equal(expected);
    }

    it("should get when not", () => {
      doTest("import test = Namespace.Test;", false);
    });

    it("should get when is", () => {
      doTest("import type test = Namespace.Test;", true);
    });
  });

  describe(nameof<ImportEqualsDeclaration>("setIsTypeOnly"), () => {
    function doTest(text: string, value: boolean, expected: string) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      firstChild.setIsTypeOnly(value);
      expect(firstChild.getText()).to.equal(expected);
    }

    it("should set when not", () => {
      doTest(
        "import test = Namespace.Test;",
        true,
        "import type test = Namespace.Test;",
      );
    });

    it("should set as not when is", () => {
      doTest(
        "import type test = Namespace.Test;",
        false,
        "import test = Namespace.Test;",
      );
    });

    it("should not change when equal", () => {
      doTest(
        "import type test = Namespace.Test;",
        true,
        "import type test = Namespace.Test;",
      );

      doTest(
        "import test = Namespace.Test;",
        false,
        "import test = Namespace.Test;",
      );
    });
  });

  describe(nameof<ImportEqualsDeclaration>("getModuleReference"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      expect(firstChild.getModuleReference().getText()).to.equal(expected);
    }

    it("should get the module reference when specifying an entity", () => {
      doTest("import test = Namespace.Test;", "Namespace.Test");
    });

    it("should get the module specifier when importing a require", () => {
      doTest(`import test = require("testing");`, `require("testing")`);
    });
  });

  describe(nameof<ImportEqualsDeclaration>("isExternalModuleReferenceRelative"), () => {
    function doTest(text: string, expected: boolean) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      expect(firstChild.isExternalModuleReferenceRelative()).to.equal(expected);
    }

    it("should not be when specifying an entity", () => {
      doTest("import test = Namespace.Test;", false);
    });

    it("should be when using ./", () => {
      doTest("import test = require('./test');", true);
    });

    it("should be when using ../", () => {
      doTest("import test = require('../test');", true);
    });

    it("should not be when using /", () => {
      doTest("import test = require('/test');", false);
    });

    it("should not be when not", () => {
      doTest("import test = require('test');", false);
    });

    it("should not be when empty", () => {
      doTest("import test = require();", false);
    });

    it("should not be when a number for some reason", () => {
      doTest("import test = require(5);", false);
    });
  });

  describe(nameof<ImportEqualsDeclaration>("setExternalModuleReference"), () => {
    function doTest(text: string, externalModuleReference: string, expected: string) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      firstChild.setExternalModuleReference(externalModuleReference);
      expect(firstChild.getText()).to.equal(expected);
    }

    it("should set the external module reference when currently a namespace", () => {
      doTest("import test = Namespace.Test;", "./test", `import test = require("./test");`);
    });

    it("should set the external module reference when currently a require with no text", () => {
      doTest("import test = require();", "./test", `import test = require("./test");`);
    });

    it("should set the external module reference when currently a require with other text", () => {
      doTest("import test = require('./test2');", "./test", `import test = require("./test");`);
    });

    it("should set the external module reference when specifying a source file", () => {
      const { firstChild, sourceFile } = getInfoFromText<ImportEqualsDeclaration>("import test = require('./test2');");
      firstChild.setExternalModuleReference(sourceFile.getDirectory().createSourceFile("test3.ts"));
      expect(firstChild.getText()).to.equal(`import test = require("./test3");`);
    });
  });

  describe(nameof<ImportEqualsDeclaration>("remove"), () => {
    function doTest(text: string, index: number, expectedText: string) {
      const { sourceFile } = getInfoFromText(text);
      (sourceFile.getStatements()[index] as ImportEqualsDeclaration).remove();
      expect(sourceFile.getFullText()).to.equal(expectedText);
    }

    it("should remove the import equals declaration", () => {
      doTest("import test = Namespace.Test;", 0, "");
    });
  });

  describe(nameof<ImportEqualsDeclaration>("getExternalModuleReferenceSourceFile"), () => {
    it("should get the referenced source file", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import test = require('./class');`);
      const classSourceFile = project.createSourceFile("class.ts", `export class Class {}`);

      expect(mainSourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportEqualsDeclaration).getExternalModuleReferenceSourceFile())
        .to.equal(classSourceFile);
    });

    it("should return undefined when the referenced file doesn't exist", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import test = require('./class');`);

      expect(mainSourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportEqualsDeclaration).getExternalModuleReferenceSourceFile()).to.be.undefined;
    });

    it("should return undefined when doesn't have an external module reference", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import test = Namespace.Test);`);

      expect(mainSourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportEqualsDeclaration).getExternalModuleReferenceSourceFile()).to.be.undefined;
    });
  });

  describe(nameof<ImportEqualsDeclaration>("getExternalModuleReferenceSourceFileOrThrow"), () => {
    it("should get the referenced source file", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import test = require('./class');`);
      const classSourceFile = project.createSourceFile("class.ts", `export class Class {}`);

      expect(mainSourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportEqualsDeclaration).getExternalModuleReferenceSourceFileOrThrow())
        .to.equal(classSourceFile);
    });

    it("should throw when doesn't have an external module reference", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import test = Namespace.Test;`);

      expect(() => mainSourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportEqualsDeclaration).getExternalModuleReferenceSourceFileOrThrow())
        .to.throw();
    });
  });

  describe(nameof<ImportEqualsDeclaration>("hasExportKeyword"), () => {
    function doTest(text: string, expected: boolean) {
      const { firstChild } = getInfoFromText<ImportEqualsDeclaration>(text);
      expect(firstChild.hasExportKeyword()).to.equal(expected);
    }

    it("should get if has export keyword", () => {
      doTest("import test = Namespace.Test;", false);
      doTest("export import test = Namespace.Test;", true);
    });
  });

  describe(nameof<ImportEqualsDeclaration>("setIsExported"), () => {
    function doTest(text: string, value: boolean, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportEqualsDeclaration>(text);
      firstChild.setIsExported(value);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should add and remove", () => {
      doTest("import test = Namespace.Test;", true, "export import test = Namespace.Test;");
      doTest("export import test = Namespace.Test;", false, "import test = Namespace.Test;");
    });
  });
});
