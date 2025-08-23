"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMissingRefs = generateMissingRefs;
// src/utils/ParameterGenerator.ts
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const pluralize_1 = __importDefault(require("pluralize"));
function indentYamlBlock(yaml, spaces = 2) {
    const pad = " ".repeat(spaces);
    return yaml
        .split("\n")
        .map((line) => (line.trim() === "" ? "" : pad + line))
        .join("\n");
}
function renderParameterTemplate(template, tag) {
    const tagLower = tag.toLowerCase();
    return template.replace(/{tag}/g, tag).replace(/{tag-lower}/g, tagLower);
}
function renderRequestBodyTemplate(template, name, tag) {
    const method = name.startsWith("Post")
        ? "Post"
        : name.startsWith("Put")
            ? "Put"
            : "Unknown";
    const type = method === "Post" ? "New" : method === "Put" ? "Updated" : "Unknown";
    const nameNoPostfix = name.replace(/Request$/, "");
    const tagPlural = (0, pluralize_1.default)(tag);
    return template
        .replace(/{name}/g, name)
        .replace(/{method}/g, method)
        .replace(/{type}/g, type)
        .replace(/{name-no-postfix}/g, nameNoPostfix)
        .replace(/{tag}/g, tag)
        .replace(/{tag-plural}/g, tagPlural);
}
function renderResponseTemplate(template, name, tag) {
    const nameNoPostfix = name.replace(/Response$/, "");
    const middle = nameNoPostfix.replace(/^(Post|Put|Get)/, "");
    const schemaType = pluralize_1.default.isPlural(middle)
        ? `Paginated${(0, pluralize_1.default)(tag)}`
        : tag;
    return template
        .replace(/{name}/g, name)
        .replace(/{name-no-postfix}/g, nameNoPostfix)
        .replace(/{schemaType}/g, schemaType);
}
function renderSchemaTemplates(templatePaginated, templateSingle, name, tag) {
    const isPaginated = name.includes("Paginated");
    const tagPlural = (0, pluralize_1.default)(tag);
    const tagPluralKebab = (0, pluralize_1.default)(tag)
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
    const nameLower = name.toLowerCase();
    const nameWithoutPrefix = name.replace(/^Paginated/, "");
    const nameSingular = pluralize_1.default.singular(nameWithoutPrefix);
    const applyReplacements = (template, replacements) => Object.entries(replacements).reduce((text, [key, value]) => {
        const pattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
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
function findMissingResponseRefs(yamlText) {
    var _a, _b;
    const doc = yaml.parse(yamlText);
    const refs = new Set();
    function walk(obj) {
        if (Array.isArray(obj))
            return obj.forEach(walk);
        if (obj && typeof obj === "object") {
            for (const [key, value] of Object.entries(obj)) {
                if (key === "$ref" &&
                    typeof value === "string" &&
                    value.startsWith("#/components/responses/")) {
                    const name = value.split("/").pop();
                    if (name)
                        refs.add(name);
                }
                else {
                    walk(value);
                }
            }
        }
    }
    walk(doc);
    const existing = Object.keys((_b = (_a = doc === null || doc === void 0 ? void 0 : doc.components) === null || _a === void 0 ? void 0 : _a.responses) !== null && _b !== void 0 ? _b : {});
    return [...refs].filter((r) => !existing.includes(r));
}
function findMissingParameterRefs(yamlText) {
    var _a, _b;
    const doc = yaml.parse(yamlText);
    const refs = new Set();
    function walk(obj) {
        if (Array.isArray(obj))
            return obj.forEach(walk);
        if (obj && typeof obj === "object") {
            for (const [key, value] of Object.entries(obj)) {
                if (key === "$ref" &&
                    typeof value === "string" &&
                    value.startsWith("#/components/parameters/")) {
                    const name = value.split("/").pop();
                    if (name)
                        refs.add(name);
                }
                else {
                    walk(value);
                }
            }
        }
    }
    walk(doc);
    const existing = Object.keys((_b = (_a = doc === null || doc === void 0 ? void 0 : doc.components) === null || _a === void 0 ? void 0 : _a.parameters) !== null && _b !== void 0 ? _b : {});
    return [...refs].filter((r) => !existing.includes(r));
}
function findMissingRequestBodyRefs(yamlText) {
    var _a, _b;
    const doc = yaml.parse(yamlText);
    const refs = new Set();
    function walk(obj) {
        if (Array.isArray(obj))
            return obj.forEach(walk);
        if (obj && typeof obj === "object") {
            for (const [key, value] of Object.entries(obj)) {
                if (key === "$ref" &&
                    typeof value === "string" &&
                    value.startsWith("#/components/requestBodies/")) {
                    const name = value.split("/").pop();
                    if (name)
                        refs.add(name);
                }
                else {
                    walk(value);
                }
            }
        }
    }
    walk(doc);
    const existing = Object.keys((_b = (_a = doc === null || doc === void 0 ? void 0 : doc.components) === null || _a === void 0 ? void 0 : _a.requestBodies) !== null && _b !== void 0 ? _b : {});
    return [...refs].filter((r) => !existing.includes(r));
}
function findMissingSchemaRefs(yamlText) {
    var _a, _b;
    const doc = yaml.parse(yamlText);
    const refs = new Set();
    function walk(obj) {
        if (Array.isArray(obj))
            return obj.forEach(walk);
        if (obj && typeof obj === "object") {
            for (const [key, value] of Object.entries(obj)) {
                if (key === "$ref" &&
                    typeof value === "string" &&
                    value.startsWith("#/components/schemas/")) {
                    const name = value.split("/").pop();
                    if (name)
                        refs.add(name);
                }
                else {
                    walk(value);
                }
            }
        }
    }
    walk(doc);
    const existing = Object.keys((_b = (_a = doc === null || doc === void 0 ? void 0 : doc.components) === null || _a === void 0 ? void 0 : _a.schemas) !== null && _b !== void 0 ? _b : {});
    return [...refs].filter((r) => !existing.includes(r));
}
function generateMissingRefs(document, tag) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const extensionPath = (_a = vscode.extensions.getExtension("JayTech.oas-analyzer")) === null || _a === void 0 ? void 0 : _a.extensionPath;
        if (!extensionPath)
            return;
        const text = document.getText();
        const doc = yaml.parseDocument(text, { keepCstNodes: true });
        const edit = new vscode.WorkspaceEdit();
        const componentsNode = doc.get("components", true);
        // === Parameters ===
        const missingParams = findMissingParameterRefs(text);
        const expectedParam = `${tag}Id`;
        if (missingParams.includes(expectedParam)) {
            const paramTemplatePath = path.join(__dirname, "../templates/parameter.yaml");
            const paramTemplate = fs.readFileSync(paramTemplatePath, "utf-8");
            const renderedParam = renderParameterTemplate(paramTemplate, tag);
            const parametersNode = componentsNode === null || componentsNode === void 0 ? void 0 : componentsNode.get("parameters", true);
            if (parametersNode === null || parametersNode === void 0 ? void 0 : parametersNode.range) {
                const insertPos = document.positionAt(parametersNode.range[1]);
                edit.insert(document.uri, insertPos, `\n  ${renderedParam}\n`);
            }
            else {
                vscode.window.showErrorMessage("❌ No components.parameters section found.");
            }
        }
        // === RequestBodies ===
        const missingBodies = findMissingRequestBodyRefs(text);
        if (missingBodies.length > 0) {
            const bodyTemplatePath = path.join(__dirname, "../templates/requestBody.yaml");
            const bodyTemplate = fs.readFileSync(bodyTemplatePath, "utf-8");
            const requestBodiesNode = componentsNode === null || componentsNode === void 0 ? void 0 : componentsNode.get("requestBodies", true);
            if (requestBodiesNode === null || requestBodiesNode === void 0 ? void 0 : requestBodiesNode.range) {
                const insertPos = document.positionAt(requestBodiesNode.range[1]);
                for (const name of missingBodies) {
                    const renderedBody = renderRequestBodyTemplate(bodyTemplate, name, tag);
                    edit.insert(document.uri, insertPos, `\n  ${renderedBody}\n`);
                }
            }
            else {
                vscode.window.showErrorMessage("❌ No components.requestBodies section found.");
            }
        }
        // === Responses ===
        const missingResponses = findMissingResponseRefs(text);
        if (missingResponses.length > 0) {
            const responseTemplatePath = path.join(__dirname, "../templates/response.yaml");
            const responseTemplate = fs.readFileSync(responseTemplatePath, "utf-8");
            const responsesNode = componentsNode === null || componentsNode === void 0 ? void 0 : componentsNode.get("responses", true);
            if (responsesNode === null || responsesNode === void 0 ? void 0 : responsesNode.range) {
                const insertPos = document.positionAt(responsesNode.range[1]);
                for (const name of missingResponses) {
                    const renderedResponse = renderResponseTemplate(responseTemplate, name, tag);
                    edit.insert(document.uri, insertPos, `\n  ${renderedResponse}\n`);
                }
            }
            else {
                vscode.window.showErrorMessage("❌ No components.responses section found.");
            }
        }
        if (!edit.entries().length) {
            vscode.window.showInformationMessage("✅ No missing $refs to insert.");
            return;
        }
        yield vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`✅ Inserted missing $refs: ${[...missingParams, ...missingBodies].join(", ")}`);
        // --- Second pass: SCHEMA refs from newly inserted content ---
        const updatedText = document.getText();
        const docAfter = yaml.parseDocument(updatedText, {
            keepCstNodes: true,
        });
        const componentsAfter = docAfter.get("components", true);
        const schemaEdit = new vscode.WorkspaceEdit();
        const missingSchemas = findMissingSchemaRefs(updatedText);
        if (missingSchemas.length > 0) {
            const schemaNode = componentsAfter === null || componentsAfter === void 0 ? void 0 : componentsAfter.get("schemas", true);
            if (schemaNode === null || schemaNode === void 0 ? void 0 : schemaNode.range) {
                const insertPos = document.positionAt(schemaNode.range[1]);
                const paginatedTemplate = fs.readFileSync(path.join(__dirname, "../templates/schema-paginated.yaml"), "utf-8");
                const objectTemplate = fs.readFileSync(path.join(__dirname, "../templates/schema-object.yaml"), "utf-8");
                for (const name of missingSchemas) {
                    const rendered = renderSchemaTemplates(paginatedTemplate, objectTemplate, name, tag);
                    schemaEdit.insert(document.uri, insertPos, `\n${indentYamlBlock(rendered)}\n`);
                }
                yield vscode.workspace.applyEdit(schemaEdit);
                vscode.window.showInformationMessage(`✅ Inserted missing schemas: ${missingSchemas.join(", ")}`);
            }
            else {
                vscode.window.showErrorMessage("❌ No components.schemas section found.");
            }
        }
        else {
            vscode.window.showInformationMessage(`✅ Inserted missing $refs: ${[
                ...missingParams,
                ...missingBodies,
                ...missingResponses,
            ].join(", ")}`);
        }
    });
}
