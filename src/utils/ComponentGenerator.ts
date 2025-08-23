// src/utils/ParameterGenerator.ts
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import pluralize from "pluralize";

function indentYamlBlock(yaml: string, spaces: number = 2): string {
  const pad = " ".repeat(spaces);
  return yaml
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

function renderParameterTemplate(template: string, tag: string): string {
  const tagLower = tag.toLowerCase();
  return template.replace(/{tag}/g, tag).replace(/{tag-lower}/g, tagLower);
}

function renderRequestBodyTemplate(
  template: string,
  name: string,
  tag: string
): string {
  const method = name.startsWith("Post")
    ? "Post"
    : name.startsWith("Put")
    ? "Put"
    : "Unknown";
  const type =
    method === "Post" ? "New" : method === "Put" ? "Updated" : "Unknown";
  const nameNoPostfix = name.replace(/Request$/, "");
  const tagPlural = pluralize(tag);

  return template
    .replace(/{name}/g, name)
    .replace(/{method}/g, method)
    .replace(/{type}/g, type)
    .replace(/{name-no-postfix}/g, nameNoPostfix)
    .replace(/{tag}/g, tag)
    .replace(/{tag-plural}/g, tagPlural);
}

function renderResponseTemplate(
  template: string,
  name: string,
  tag: string
): string {
  const nameNoPostfix = name.replace(/Response$/, "");
  const middle = nameNoPostfix.replace(/^(Post|Put|Get)/, "");
  const schemaType = pluralize.isPlural(middle)
    ? `Paginated${pluralize(tag)}`
    : tag;

  return template
    .replace(/{name}/g, name)
    .replace(/{name-no-postfix}/g, nameNoPostfix)
    .replace(/{schemaType}/g, schemaType);
}

function renderSchemaTemplates(
  templatePaginated: string,
  templateSingle: string,
  name: string,
  tag: string
): string {
  const isPaginated = name.includes("Paginated");
  const tagPlural = pluralize(tag);
  const tagPluralKebab = pluralize(tag)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
  const nameLower = name.toLowerCase();

  const nameWithoutPrefix = name.replace(/^Paginated/, "");
  const nameSingular = pluralize.singular(nameWithoutPrefix);

  const applyReplacements = (
    template: string,
    replacements: Record<string, string>
  ) =>
    Object.entries(replacements).reduce((text, [key, value]) => {
      const pattern = new RegExp(
        key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      return text.replace(pattern, value);
    }, template);

  if (isPaginated) {
    const paginatedReplacements = {
      "{name}": name,
      "{name-lower}": nameLower,
      "{name-singular}": nameSingular,
      "{tag}": tag,
      "{tag-plural}": tagPlural,
      "{tag-plural-kebab}": tagPluralKebab,
    };

    return applyReplacements(templatePaginated, paginatedReplacements);
  }

  const singularReplacements = {
    "{name}": name,
    "{name-lower}": nameLower,
    "{name-singular}": nameSingular,
    "{tag}": tag,
    "{tag-plural}": tagPlural,
    "{tag-plural-kebab}": tagPluralKebab,
  };

  return applyReplacements(templateSingle, singularReplacements);
}

function findMissingResponseRefs(yamlText: string): string[] {
  const doc = yaml.parse(yamlText);
  const refs = new Set<string>();

  function walk(obj: any) {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("#/components/responses/")
        ) {
          const name = value.split("/").pop();
          if (name) refs.add(name);
        } else {
          walk(value);
        }
      }
    }
  }

  walk(doc);

  const existing = Object.keys(doc?.components?.responses ?? {});
  return [...refs].filter((r) => !existing.includes(r));
}

function findMissingParameterRefs(yamlText: string): string[] {
  const doc = yaml.parse(yamlText);
  const refs = new Set<string>();

  function walk(obj: any) {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("#/components/parameters/")
        ) {
          const name = value.split("/").pop();
          if (name) refs.add(name);
        } else {
          walk(value);
        }
      }
    }
  }

  walk(doc);

  const existing = Object.keys(doc?.components?.parameters ?? {});
  return [...refs].filter((r) => !existing.includes(r));
}

function findMissingRequestBodyRefs(yamlText: string): string[] {
  const doc = yaml.parse(yamlText);
  const refs = new Set<string>();

  function walk(obj: any) {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("#/components/requestBodies/")
        ) {
          const name = value.split("/").pop();
          if (name) refs.add(name);
        } else {
          walk(value);
        }
      }
    }
  }

  walk(doc);

  const existing = Object.keys(doc?.components?.requestBodies ?? {});
  return [...refs].filter((r) => !existing.includes(r));
}

function findMissingSchemaRefs(yamlText: string): string[] {
  const doc = yaml.parse(yamlText);
  const refs = new Set<string>();

  function walk(obj: any) {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("#/components/schemas/")
        ) {
          const name = value.split("/").pop();
          if (name) refs.add(name);
        } else {
          walk(value);
        }
      }
    }
  }

  walk(doc);

  const existing = Object.keys(doc?.components?.schemas ?? {});
  return [...refs].filter((r) => !existing.includes(r));
}

export async function generateMissingRefs(
  document: vscode.TextDocument,
  tag: string
): Promise<void> {
  const extensionPath = vscode.extensions.getExtension(
    "JayTech.oas-analyzer"
  )?.extensionPath;
  if (!extensionPath) return;

  const text = document.getText();
  const doc = yaml.parseDocument(text, { keepCstNodes: true } as any);

  const edit = new vscode.WorkspaceEdit();
  const componentsNode = doc.get("components", true) as any;

  // === Parameters ===
  const missingParams = findMissingParameterRefs(text);
  const expectedParam = `${tag}Id`;

  if (missingParams.includes(expectedParam)) {
    const paramTemplatePath = path.join(
      __dirname,
      "../templates/parameter.yaml"
    );
    const paramTemplate = fs.readFileSync(paramTemplatePath, "utf-8");
    const renderedParam = renderParameterTemplate(paramTemplate, tag);

    const parametersNode = componentsNode?.get("parameters", true) as any;
    if (parametersNode?.range) {
      const insertPos = document.positionAt(parametersNode.range[1]);
      edit.insert(document.uri, insertPos, `\n  ${renderedParam}\n`);
    } else {
      vscode.window.showErrorMessage(
        "❌ No components.parameters section found."
      );
    }
  }

  // === RequestBodies ===
  const missingBodies = findMissingRequestBodyRefs(text);
  if (missingBodies.length > 0) {
    const bodyTemplatePath = path.join(
      __dirname,
      "../templates/requestBody.yaml"
    );
    const bodyTemplate = fs.readFileSync(bodyTemplatePath, "utf-8");

    const requestBodiesNode = componentsNode?.get("requestBodies", true) as any;
    if (requestBodiesNode?.range) {
      const insertPos = document.positionAt(requestBodiesNode.range[1]);
      for (const name of missingBodies) {
        const renderedBody = renderRequestBodyTemplate(bodyTemplate, name, tag);
        edit.insert(document.uri, insertPos, `\n  ${renderedBody}\n`);
      }
    } else {
      vscode.window.showErrorMessage(
        "❌ No components.requestBodies section found."
      );
    }
  }

  // === Responses ===
  const missingResponses = findMissingResponseRefs(text);
  if (missingResponses.length > 0) {
    const responseTemplatePath = path.join(
      __dirname,
      "../templates/response.yaml"
    );
    const responseTemplate = fs.readFileSync(responseTemplatePath, "utf-8");

    const responsesNode = componentsNode?.get("responses", true) as any;
    if (responsesNode?.range) {
      const insertPos = document.positionAt(responsesNode.range[1]);
      for (const name of missingResponses) {
        const renderedResponse = renderResponseTemplate(
          responseTemplate,
          name,
          tag
        );
        edit.insert(document.uri, insertPos, `\n  ${renderedResponse}\n`);
      }
    } else {
      vscode.window.showErrorMessage(
        "❌ No components.responses section found."
      );
    }
  }

  if (!edit.entries().length) {
    vscode.window.showInformationMessage("✅ No missing $refs to insert.");
    return;
  }

  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage(
    `✅ Inserted missing $refs: ${[...missingParams, ...missingBodies].join(
      ", "
    )}`
  );

  // --- Second pass: SCHEMA refs from newly inserted content ---
  const updatedText = document.getText();
  const docAfter = yaml.parseDocument(updatedText, {
    keepCstNodes: true,
  } as any);
  const componentsAfter = docAfter.get("components", true) as any;

  const schemaEdit = new vscode.WorkspaceEdit();
  const missingSchemas = findMissingSchemaRefs(updatedText);

  if (missingSchemas.length > 0) {
    const schemaNode = componentsAfter?.get("schemas", true) as any;
    if (schemaNode?.range) {
      const insertPos = document.positionAt(schemaNode.range[1]);
      const paginatedTemplate = fs.readFileSync(
        path.join(__dirname, "../templates/schema-paginated.yaml"),
        "utf-8"
      );
      const objectTemplate = fs.readFileSync(
        path.join(__dirname, "../templates/schema-object.yaml"),
        "utf-8"
      );

      for (const name of missingSchemas) {
        const rendered = renderSchemaTemplates(
          paginatedTemplate,
          objectTemplate,
          name,
          tag
        );
        schemaEdit.insert(
          document.uri,
          insertPos,
          `\n${indentYamlBlock(rendered)}\n`
        );
      }

      await vscode.workspace.applyEdit(schemaEdit);
      vscode.window.showInformationMessage(
        `✅ Inserted missing schemas: ${missingSchemas.join(", ")}`
      );
    } else {
      vscode.window.showErrorMessage("❌ No components.schemas section found.");
    }
  } else {
    vscode.window.showInformationMessage(
      `✅ Inserted missing $refs: ${[
        ...missingParams,
        ...missingBodies,
        ...missingResponses,
      ].join(", ")}`
    );
  }
}
