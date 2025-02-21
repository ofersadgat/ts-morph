import { errors, ModuleResolutionKind, nameof } from "@ts-morph/common";
import { expect } from "chai";
import { ImportDeclaration } from "../../../../compiler";
import { Project } from "../../../../Project";
import { ImportAttributeStructure, ImportDeclarationStructure, ImportSpecifierStructure, OptionalKind, StructureKind } from "../../../../structures";
import { WriterFunction } from "../../../../types";
import { getInfoFromText, OptionalKindAndTrivia, OptionalTrivia } from "../../testHelpers";

describe("ImportDeclaration", () => {
  describe(nameof<ImportDeclaration>("isTypeOnly"), () => {
    function doTest(text: string, expected: boolean) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.isTypeOnly()).to.equal(expected);
    }

    it("should be when is", () => {
      doTest("import type { Test } from './test'", true);
    });

    it("should not be when not", () => {
      doTest("import { Test } from './test'", false);
    });
  });

  describe(nameof<ImportDeclaration>("setIsTypeOnly"), () => {
    function doTest(text: string, value: boolean, expectedText: string) {
      const { sourceFile, firstChild } = getInfoFromText<ImportDeclaration>(text);
      firstChild.setIsTypeOnly(value);
      expect(sourceFile.getFullText()).to.equal(expectedText);
    }

    it("should leave alone when setting the same for named imports", () => {
      doTest("import type { Test } from './test'", true, "import type { Test } from './test'");
      doTest("import { Test } from './test'", false, "import { Test } from './test'");
      doTest("import * as test from './test'", false, "import * as test from './test'");
    });

    it("should set when not for named imports", () => {
      doTest("import { Test } from './test'", true, "import type { Test } from './test'");
    });

    it("should set not when is for named imports", () => {
      doTest("import type { Test } from './test'", false, "import { Test } from './test'");
    });

    it("should leave alone when setting the same for default import", () => {
      doTest("import type Test from './test'", true, "import type Test from './test'");
      doTest("import Test from './test'", false, "import Test from './test'");
    });

    it("should set when not for default import", () => {
      doTest("import Test from './test'", true, "import type Test from './test'");
    });

    it("should set not when is for default import", () => {
      doTest("import type Test from './test'", false, "import Test from './test'");
    });

    it("should leave alone when setting the same for namespace import", () => {
      doTest("import type * as test from './test'", true, "import type * as test from './test'");
      doTest("import * as test from './test'", false, "import * as test from './test'");
    });

    it("should set when not for namespace import", () => {
      doTest("import * as test from './test'", true, "import type * as test from './test'");
    });

    it("should set not when is for namespace import", () => {
      doTest("import type * as test from './test'", false, "import * as test from './test'");
    });
  });

  describe(nameof<ImportDeclaration>("setModuleSpecifier"), () => {
    function doTest(text: string, newModuleSpecifier: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.setModuleSpecifier(newModuleSpecifier);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should set the module specifier when using single quotes", () => {
      doTest(`import test from './test';`, "./new-test", `import test from './new-test';`);
    });

    it("should set the module specifier when using double quotes", () => {
      doTest(`import test from "./test";`, "./new-test", `import test from "./new-test";`);
    });

    it("should set the module specifier when it's empty", () => {
      doTest(`import test from "";`, "./new-test", `import test from "./new-test";`);
    });

    it("should set the module specifier when it's provided a source file", () => {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(`import {test} from "./other";`);
      firstChild.setModuleSpecifier(sourceFile.copy("newFile.ts"));
      expect(sourceFile.getText()).to.equal(`import {test} from "./newFile";`);
    });
  });

  describe(nameof<ImportDeclaration>("getModuleSpecifier"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.getModuleSpecifier().getText()).to.equal(expected);
    }

    it("should get the module specifier", () => {
      doTest("import * as test from './test'", "'./test'");
    });
  });

  describe(nameof<ImportDeclaration>("getModuleSpecifierValue"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.getModuleSpecifierValue()).to.equal(expected);
    }

    it("should get the module specifier when using single quotes", () => {
      doTest("import * as test from './test'", "./test");
    });

    it("should get the module specifier when using double quotes", () => {
      doTest(`import defaultExport, {test} from "./test"`, "./test");
    });

    it("should get the module specifier when importing for side effects", () => {
      doTest(`import "./test"`, "./test");
    });
  });

  describe(nameof<ImportDeclaration>("getModuleSpecifierSourceFileOrThrow"), () => {
    it("should get the source file", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);
      const classSourceFile = project.createSourceFile("class.ts", `export class Class {}`);

      expect(mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFileOrThrow()).to.equal(classSourceFile);
    });

    it("should throw when it doesn't exist", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);

      expect(() => mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFileOrThrow()).to.throw();
    });
  });

  describe(nameof<ImportDeclaration>("getModuleSpecifierSourceFile"), () => {
    it("should get the source file", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);
      const classSourceFile = project.createSourceFile("class.ts", `export class Class {}`);

      expect(mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFile()).to.equal(classSourceFile);
    });

    it("should get the source file when it's an index.ts file", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);
      const classSourceFile = project.createSourceFile("class/index.ts", `export class Class {}`);

      expect(mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFile()).to.equal(classSourceFile);
    });

    it("should not get the source file when it's an index.ts file and using classic module resolution", () => {
      // needs to be NodeJs resolution to work
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: { moduleResolution: ModuleResolutionKind.Classic } });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);
      const classSourceFile = project.createSourceFile("class/index.ts", `export class Class {}`);

      expect(mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFile()).to.be.undefined;
    });

    it("should return undefined when it doesn't exist", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const mainSourceFile = project.createSourceFile("main.ts", `import {Class} from "./class";`);

      expect(mainSourceFile.getImportDeclarations()[0].getModuleSpecifierSourceFile()).to.be.undefined;
    });
  });

  describe(nameof<ImportDeclaration>("isModuleSpecifierRelative"), () => {
    function doTest(text: string, expected: boolean) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.isModuleSpecifierRelative()).to.equal(expected);
    }

    it("should be when using ./", () => {
      doTest("import * as test from './test'", true);
    });

    it("should be when using ../", () => {
      doTest("import * as test from '../test'", true);
    });

    it("should not be when using /", () => {
      doTest("import * as test from '/test'", false);
    });

    it("should not be when not", () => {
      doTest("import * as test from 'test'", false);
    });
  });

  describe(nameof<ImportDeclaration>("setDefaultImport"), () => {
    function doTest(text: string, newDefaultImport: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.setDefaultImport(newDefaultImport);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should remove when empty", () => {
      doTest(`import identifier from './file'; const t = identifier;`, "", `import './file'; const t = identifier;`);
    });

    it("should not rename when exists", () => {
      doTest(`import identifier from './file'; const t = identifier;`, "newName", `import newName from './file'; const t = identifier;`);
    });

    it("should set the default import when importing for side effects", () => {
      doTest(`import './file';`, "identifier", `import identifier from './file';`);
    });

    it("should set the default import when named import exists", () => {
      doTest(`import {named} from './file';`, "identifier", `import identifier, {named} from './file';`);
    });

    it("should set the default import when namespace import exists", () => {
      doTest(`import * as name from './file';`, "identifier", `import identifier, * as name from './file';`);
    });
  });

  describe(nameof<ImportDeclaration>("renameDefaultImport"), () => {
    function doTest(text: string, newDefaultImport: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.renameDefaultImport(newDefaultImport);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should remove when empty", () => {
      doTest(`import identifier from './file'; const t = identifier;`, "", `import './file'; const t = identifier;`);
    });

    it("should not rename when exists", () => {
      doTest(`import identifier from './file'; const t = identifier;`, "newName", `import newName from './file'; const t = newName;`);
    });

    it("should set the default import when importing for side effects", () => {
      doTest(`import './file';`, "identifier", `import identifier from './file';`);
    });

    it("should set the default import when named import exists", () => {
      doTest(`import {named} from './file';`, "identifier", `import identifier, {named} from './file';`);
    });

    it("should set the default import when namespace import exists", () => {
      doTest(`import * as name from './file';`, "identifier", `import identifier, * as name from './file';`);
    });
  });

  describe(nameof<ImportDeclaration>("getDefaultImport"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      const defaultImport = firstChild.getDefaultImport();
      expect(defaultImport?.getText()).to.equal(expectedName);
    }

    it("should get the default import when it exists", () => {
      doTest(`import defaultImport from "./test";`, "defaultImport");
    });

    it("should get the default import when a named import exists as well", () => {
      doTest(`import defaultImport, {name as any} from "./test";`, "defaultImport");
    });

    it("should get the default import when a namespace import exists as well", () => {
      doTest(`import defaultImport, * as name from "./test";`, "defaultImport");
    });

    it("should not get the default import when a named import exists", () => {
      doTest(`import {name as any} from "./test";`, undefined);
    });

    it("should not get the default import when a namespace import exists", () => {
      doTest(`import * as name from "./test";`, undefined);
    });

    it("should not get the default import when importing for the side effects", () => {
      doTest(`import "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("getDefaultImport"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      if (expectedName == null)
        expect(() => firstChild.getDefaultImportOrThrow()).to.throw();
      else
        expect(firstChild.getDefaultImportOrThrow().getText()).to.equal(expectedName);
    }

    it("should get the default import when it exists", () => {
      doTest(`import defaultImport from "./test";`, "defaultImport");
    });

    it("should throw when default import does not exists", () => {
      doTest(`import { named } from "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("setNamespaceImport"), () => {
    function doTest(text: string, newNamespaceImport: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.setNamespaceImport(newNamespaceImport);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should rename when exists", () => {
      doTest(`import * as identifier from './file'; const t = identifier;`, "newName", `import * as newName from './file'; const t = newName;`);
    });

    it("should set the namespace import when importing for side effects", () => {
      doTest(`import './file';`, "identifier", `import * as identifier from './file';`);
    });

    it("should remove it when providing an empty string", () => {
      doTest(`import * as identifier from './file';`, "", `import './file';`);
    });

    it("should do nothing when it doesn't exist and providing an empty string", () => {
      doTest(`import './file';`, "", `import './file';`);
    });

    it("should throw an error when a named import exists", () => {
      expect(() => {
        const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(`import {named} from './file';`);
        firstChild.setNamespaceImport("identifier");
      }).to.throw();
    });

    it("should set the namespace import when a default import exists", () => {
      doTest(`import name from './file';`, "identifier", `import name, * as identifier from './file';`);
    });
  });

  describe(nameof<ImportDeclaration>("removeDefaultImport"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.removeDefaultImport();
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should remove it when it exists", () => {
      doTest(`import identifier from './file';`, `import './file';`);
    });

    it("should do nothing when it doesn't exists", () => {
      doTest(`import './file';`, `import './file';`);
    });

    it("should remove it when a namespace import exists", () => {
      doTest(`import name, * as identifier from './file';`, `import * as identifier from './file';`);
    });

    it("should remove it when named imports exists", () => {
      doTest(`import name, { test } from './file';`, `import { test } from './file';`);
    });

    it("should handle import type", () => {
      doTest(`import type test from './file';`, `import type {} from './file';`);
    });

    it("should handle import type with named imports", () => {
      doTest(`import type test, { other } from './file';`, `import type { other } from './file';`);
    });
  });

  describe(nameof<ImportDeclaration>("removeNamespaceImport"), () => {
    function doTest(text: string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.removeNamespaceImport();
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should remove it when a namespace import exists", () => {
      doTest(`import * as identifier from './file';`, `import './file';`);
    });

    it("should do nothing when a namespace import doesn't exists", () => {
      doTest(`import './file';`, `import './file';`);
    });

    it("should remove it when a default import exists", () => {
      doTest(`import name, * as identifier from './file';`, `import name from './file';`);
    });
  });

  describe(nameof<ImportDeclaration>("getNamespaceImport"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      const identifier = firstChild.getNamespaceImport();
      expect(identifier?.getText()).to.equal(expectedName);
    }

    it("should get the namespace import when it exists", () => {
      doTest(`import * as name from "./test";`, "name");
    });

    it("should get the namespace import when a default import exists as well", () => {
      doTest(`import defaultImport, * as name from "./test";`, "name");
    });

    it("should not get the default import when a default and named import exist", () => {
      doTest(`import defaultImport, {name as any} from "./test";`, undefined);
    });

    it("should not get the namespace import when a named import exists", () => {
      doTest(`import {name as any} from "./test";`, undefined);
    });

    it("should not get the namespace import when a default import exists", () => {
      doTest(`import defaultImport from "./test";`, undefined);
    });

    it("should not get the namespace import when importing for the side effects", () => {
      doTest(`import "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("getNamespaceImportOrThrow"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      if (expectedName == null)
        expect(() => firstChild.getNamespaceImportOrThrow()).to.throw();
      else
        expect(firstChild.getNamespaceImportOrThrow().getText()).to.equal(expectedName);
    }

    it("should get the namespace import when it exists", () => {
      doTest(`import * as name from "./test";`, "name");
    });

    it("should throw when the namespace import doesn't exist", () => {
      doTest(`import "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("getNamedImports"), () => {
    function doTest(text: string, expected: { name: string; alias?: string }[]) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      const namedImports = firstChild.getNamedImports();
      expect(namedImports.length).to.equal(expected.length);
      for (let i = 0; i < namedImports.length; i++) {
        expect(namedImports[i].getNameNode().getText()).to.equal(expected[i].name);
        if (expected[i].alias == null)
          expect(namedImports[i].getAliasNode()).to.equal(undefined);
        else
          expect(namedImports[i].getAliasNode()!.getText()).to.equal(expected[i].alias);
      }
    }

    it("should get the named imports", () => {
      doTest(`import {name, name2, name3 as name4} from "./test";`, [{ name: "name" }, { name: "name2" }, { name: "name3", alias: "name4" }]);
    });

    it("should get the named import when a default and named import exist", () => {
      doTest(`import defaultImport, {name as any} from "./test";`, [{ name: "name", alias: "any" }]);
    });

    it("should not get anything when only a namespace import exists", () => {
      doTest(`import * as name from "./test";`, []);
    });

    it("should not get anything when a a namespace import and a default import exists", () => {
      doTest(`import defaultImport, * as name from "./test";`, []);
    });

    it("should not get anything when a default import exists", () => {
      doTest(`import defaultImport from "./test";`, []);
    });

    it("should not get anything when importing for the side effects", () => {
      doTest(`import "./test";`, []);
    });
  });

  describe(nameof<ImportDeclaration>("insertNamedImports"), () => {
    function doTest(
      text: string,
      index: number,
      structuresOrNames: (OptionalKind<ImportSpecifierStructure> | string | WriterFunction)[] | WriterFunction,
      expected: string,
      surroundWithSpaces = true,
    ) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      if (!surroundWithSpaces)
        firstChild._context.manipulationSettings.set({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false });
      const originalCount = firstChild.getNamedImports().length;
      const result = firstChild.insertNamedImports(index, structuresOrNames);
      const afterCount = firstChild.getNamedImports().length;
      expect(result.length).to.equal(afterCount - originalCount);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should insert named imports when importing for the side effects", () => {
      doTest(
        `import "./test";`,
        0,
        ["name", { name: "name", alias: "alias" }, writer => writer.write("name2")],
        `import { name, name as alias, name2 } from "./test";`,
      );
    });

    it("should insert named imports when a default import exists", () => {
      doTest(`import Default from "./test";`, 0, [{ name: "name" }, { name: "name2" }], `import Default, { name, name2 } from "./test";`);
    });

    it("should insert named imports at the start", () => {
      doTest(`import { name3 } from "./test";`, 0, [{ name: "name1" }, { name: "name2" }], `import { name1, name2, name3 } from "./test";`);
    });

    it("should insert named imports at the start when it shouldn't use a space", () => {
      doTest(`import {name2} from "./test";`, 0, ["name1"], `import {name1, name2} from "./test";`, false);
    });

    it("should insert named imports at the end", () => {
      doTest(`import { name1 } from "./test";`, 1, [{ name: "name2" }, { name: "name3" }], `import { name1, name2, name3 } from "./test";`);
    });

    it("should insert named imports at the end when it shouldn't use a space", () => {
      doTest(`import {name1} from "./test";`, 1, ["name2"], `import {name1, name2} from "./test";`, false);
    });

    it("should insert named imports in the middle", () => {
      doTest(`import {name1, name4} from "./test";`, 1, [{ name: "name2" }, { name: "name3" }], `import {name1, name2, name3, name4} from "./test";`);
    });

    it("should insert with a writer function", () => {
      doTest(`import { name1 } from "./test";`, 1, writer => writer.writeLine("name2,").write("name3"), `import { name1, name2,\n    name3 } from "./test";`);
    });
  });

  describe(nameof<ImportDeclaration>("insertNamedImport"), () => {
    function doTest(text: string, index: number, structureOrName: OptionalKind<ImportSpecifierStructure> | string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.insertNamedImport(index, structureOrName);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should insert at the specified index", () => {
      doTest(`import {name1, name3} from "./test";`, 1, { name: "name2" }, `import {name1, name2, name3} from "./test";`);
    });

    it("should insert at the specified index as a string", () => {
      doTest(`import {name1, name3} from "./test";`, 1, "name2", `import {name1, name2, name3} from "./test";`);
    });
  });

  describe(nameof<ImportDeclaration>("addNamedImport"), () => {
    function doTest(text: string, structureOrName: OptionalKind<ImportSpecifierStructure> | string, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.addNamedImport(structureOrName);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should add at the end", () => {
      doTest(`import { name1, name2 } from "./test";`, { name: "name3" }, `import { name1, name2, name3 } from "./test";`);
    });

    it("should add at the end as a string", () => {
      doTest(`import { name1, name2 } from "./test";`, "name3", `import { name1, name2, name3 } from "./test";`);
    });
  });

  describe(nameof<ImportDeclaration>("addNamedImports"), () => {
    function doTest(text: string, structures: (OptionalKind<ImportSpecifierStructure> | string)[], expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.addNamedImports(structures);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should add named imports at the end", () => {
      doTest(`import { name1 } from "./test";`, [{ name: "name2" }, { name: "name3" }, "name4"], `import { name1, name2, name3, name4 } from "./test";`);
    });
  });

  describe(nameof<ImportDeclaration>("remove"), () => {
    function doTest(text: string, index: number, expectedText: string) {
      const { sourceFile } = getInfoFromText(text);
      sourceFile.getImportDeclarations()[index].remove();
      expect(sourceFile.getFullText()).to.equal(expectedText);
    }

    it("should remove the import declaration", () => {
      doTest("import * from 'i';\nimport * from 'j';\nimport * from 'k';\n", 1, "import * from 'i';\nimport * from 'k';\n");
    });
  });

  describe(nameof<ImportDeclaration>("removeNamedImports"), () => {
    function doTest(text: string, expectedText: string) {
      const { sourceFile } = getInfoFromText(text);
      sourceFile.getImportDeclarations()[0].removeNamedImports();
      expect(sourceFile.getFullText()).to.equal(expectedText);
    }

    it("should remove the named imports when only named imports exist", () => {
      doTest(`import {Name1, Name2} from "module-name";`, `import "module-name";`);
    });

    it("should remove the named imports when a default import exist", () => {
      doTest(`import defaultExport, {Name1, Name2} from "module-name";`, `import defaultExport from "module-name";`);
    });
  });

  describe(nameof<ImportDeclaration>("getImportClauseOrThrow"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      if (expectedName == null)
        expect(() => firstChild.getImportClauseOrThrow()).to.throw();
      else
        expect(firstChild.getImportClauseOrThrow().getText()).to.equal(expectedName);
    }

    it("should get the import clause when it exists", () => {
      doTest(`import * as name from "./test";`, "* as name");
    });

    it("should throw when the import clause doesn't exist", () => {
      doTest(`import "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("getImportClause"), () => {
    function doTest(text: string, expectedName: string | undefined) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.getImportClause()?.getText()).to.equal(expectedName);
    }

    it("should get the import clause when it exists", () => {
      doTest(`import * as name from "./test";`, "* as name");
    });

    it("should return undefined when the import clause doesn't exist", () => {
      doTest(`import "./test";`, undefined);
    });
  });

  describe(nameof<ImportDeclaration>("setAttributes"), () => {
    function doTest(text: string, structure: OptionalKind<ImportAttributeStructure>[] | undefined, expected: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.setAttributes(structure);
      expect(sourceFile.getText()).to.equal(expected);
    }

    it("should add", () => {
      doTest(
        `import {} from "./test";`,
        [{ name: "type", value: "value" }],
        `import {} from "./test" with {\n    type: "value"\n};`,
      );
    });

    it("should add when no semi-colon", () => {
      doTest(
        `import {} from "./test"`,
        [{ name: "type", value: "value" }],
        `import {} from "./test" with {\n    type: "value"\n}`,
      );
    });

    it("should remove for undefined", () => {
      doTest(
        `import {} from "./test" with { type: "value" };`,
        undefined,
        `import {} from "./test";`,
      );
    });

    it("should set", () => {
      doTest(
        `import {} from "./test" with { something: "asdf" };`,
        [{ name: "type", value: "value" }, { name: "other", value: "test" }],
        `import {} from "./test" with {\n    type: "value",\n    other: "test"\n};`,
      );
    });
  });

  describe(nameof<ImportDeclaration>("set"), () => {
    function doTest(text: string, structure: Partial<ImportDeclarationStructure>, expectedText: string) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      firstChild.set(structure);
      expect(sourceFile.getFullText()).to.equal(expectedText);
    }

    it("should do nothing when empty", () => {
      const code = `import asdf, * as test from "test";`;
      doTest(code, {}, code);
    });

    it("should add default when nothing exists", () => {
      doTest(`import "test";`, { defaultImport: "asdf" }, `import asdf from "test";`);
    });

    it("should add namespace when nothing exists", () => {
      doTest(`import "test";`, { namespaceImport: "asdf" }, `import * as asdf from "test";`);
    });

    it("should add named imports when nothing exists", () => {
      doTest(`import "test";`, { namedImports: [{ name: "asdf" }] }, `import { asdf } from "test";`);
    });

    it("should add named when a default exists", () => {
      doTest(`import asdf from "test";`, { namedImports: [{ name: "asdf" }] }, `import asdf, { asdf } from "test";`);
    });

    it("should add namespace when a default exists", () => {
      doTest(`import asdf from "test";`, { namespaceImport: "asdf" }, `import asdf, * as asdf from "test";`);
    });

    it("should replace namespace", () => {
      doTest(`import * as test from "test";`, { namespaceImport: "asdf" }, `import * as asdf from "test";`);
    });

    it("should replace namespace when a default also exists", () => {
      doTest(`import asdf, * as test from "test";`, { namespaceImport: "asdf" }, `import asdf, * as asdf from "test";`);
    });

    it("should replace named imports", () => {
      doTest(`import { test } from "test";`, { namedImports: [{ name: "asdf" }] }, `import { asdf } from "test";`);
    });

    it("should replace named imports when a default also exists", () => {
      doTest(`import asdf, { test } from "test";`, { namedImports: [{ name: "asdf" }] }, `import asdf, { asdf } from "test";`);
    });

    it("should add named imports when removing a namespace import", () => {
      doTest(`import * as test from "test";`, { namedImports: [{ name: "asdf" }], namespaceImport: undefined }, `import { asdf } from "test";`);
    });

    it("should add namespace import when removing a named import", () => {
      doTest(`import * as test from "test";`, { namedImports: [{ name: "asdf" }], namespaceImport: undefined }, `import { asdf } from "test";`);
    });

    it("should remove default specifying", () => {
      doTest(`import asdf from "test";`, { defaultImport: undefined }, `import "test";`);
    });

    it("should remove named imports specifying", () => {
      doTest(`import { test } from "test";`, { namedImports: undefined }, `import "test";`);
    });

    it("should remove namespace import when specifying", () => {
      doTest(`import * as test from "test";`, { namespaceImport: undefined }, `import "test";`);
    });

    it("should change module specifier when specifying", () => {
      doTest(`import * as test from "test";`, { moduleSpecifier: "new" }, `import * as test from "new";`);
    });

    it("should set everything when specified", () => {
      const structure: OptionalKindAndTrivia<MakeRequired<ImportDeclarationStructure>> = {
        isTypeOnly: true,
        defaultImport: "asdf",
        moduleSpecifier: "new",
        namedImports: undefined,
        namespaceImport: "test",
        attributes: [{
          name: "type",
          value: "asdf",
        }],
      };
      doTest(
        "import 'test';",
        structure,
        `import type asdf, * as test from 'new' with {\n    type: "asdf"\n};`,
      );
    });

    function doThrowTest(text: string, structure: Partial<ImportDeclarationStructure>) {
      const { firstChild, sourceFile } = getInfoFromText<ImportDeclaration>(text);
      expect(() => firstChild.set(structure)).to.throw(errors.InvalidOperationError);
    }

    it("should throw when adding named imports when a namespace exists", () => {
      doThrowTest(`import * as asdf from "test";`, { namedImports: [{ name: "test" }] });
    });

    it("should throw when adding namespace import when named exist", () => {
      doThrowTest(`import { asdf } from "test";`, { namespaceImport: "test" });
    });
  });

  describe(nameof<ImportDeclaration>("getStructure"), () => {
    function doTest(text: string, expectedStructure: OptionalTrivia<MakeRequired<ImportDeclarationStructure>>) {
      const { firstChild } = getInfoFromText<ImportDeclaration>(text);
      expect(firstChild.getStructure()).to.deep.equal(expectedStructure);
    }

    it("should work when is type only", () => {
      doTest(`import type { } from 'foo' with { type: 'asdf' }`, {
        kind: StructureKind.ImportDeclaration,
        isTypeOnly: true,
        defaultImport: undefined,
        moduleSpecifier: "foo",
        namedImports: [],
        namespaceImport: undefined,
        attributes: [{
          kind: StructureKind.ImportAttribute,
          name: "type",
          value: "'asdf'",
        }],
      });
    });

    it("should work when has named imports", () => {
      doTest(`import { a } from 'foo'`, {
        kind: StructureKind.ImportDeclaration,
        isTypeOnly: false,
        defaultImport: undefined,
        moduleSpecifier: "foo",
        namedImports: [{
          kind: StructureKind.ImportSpecifier,
          name: "a",
          alias: undefined,
          isTypeOnly: false,
        }],
        namespaceImport: undefined,
        attributes: undefined,
      });
    });

    it("should work when is a namespace import", () => {
      doTest(`import * as ts from 'typescript'`, {
        kind: StructureKind.ImportDeclaration,
        isTypeOnly: false,
        defaultImport: undefined,
        moduleSpecifier: "typescript",
        namedImports: [],
        namespaceImport: "ts",
        attributes: undefined,
      });
    });

    it("should work for default imports", () => {
      doTest(`import bar from 'foo'`, {
        kind: StructureKind.ImportDeclaration,
        isTypeOnly: false,
        defaultImport: "bar",
        moduleSpecifier: "foo",
        namedImports: [],
        namespaceImport: undefined,
        attributes: undefined,
      });
    });

    it("should work for default with named imports", () => {
      doTest(`import bar, {test} from 'foo'`, {
        kind: StructureKind.ImportDeclaration,
        isTypeOnly: false,
        defaultImport: "bar",
        moduleSpecifier: "foo",
        namedImports: [{
          kind: StructureKind.ImportSpecifier,
          name: "test",
          alias: undefined,
          isTypeOnly: false,
        }],
        namespaceImport: undefined,
        attributes: undefined,
      });
    });
  });
});
