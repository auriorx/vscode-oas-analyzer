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
function kebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}
function camelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function indentYamlBlock(yaml, spaces = 2) {
    const pad = " ".repeat(spaces);
    return yaml
        .split("\n")
        .map((line) => (line.trim() === "" ? "" : pad + line))
        .join("\n");
}
function renderParameterTemplate(template, tag) {
    const tagCamel = camelCase(tag);
    const tagLower = tag.toLowerCase();
    const tagKebabLower = kebab(tag);
    return template
        .replace(/{tag}/g, tag)
        .replace(/{tag-camel}/g, tagCamel)
        .replace(/{tag-lower}/g, tagLower)
        .replace(/{tag-kebab-lower}/g, tagKebabLower);
}
function renderSortParameterTemplate(template, tag) {
    const tagPlural = (0, pluralize_1.default)(tag);
    return template
        .replace(/{tag}/g, tag)
        .replace(/{tag-plural}/g, tagPlural);
}
function renderSortSchemaTemplate(template, tag) {
    const tagPlural = (0, pluralize_1.default)(tag);
    const tagKebabLower = kebab(tag);
    return template
        .replace(/{tag}/g, tag)
        .replace(/{tag-plural}/g, tagPlural)
        .replace(/{tag-kebab-lower}/g, tagKebabLower);
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
function checkForGenericComponents(yamlText) {
    var _a, _b, _c, _d, _e, _f;
    const doc = yaml.parse(yamlText);
    const schemas = (_b = (_a = doc === null || doc === void 0 ? void 0 : doc.components) === null || _a === void 0 ? void 0 : _a.schemas) !== null && _b !== void 0 ? _b : {};
    const headers = (_d = (_c = doc === null || doc === void 0 ? void 0 : doc.components) === null || _c === void 0 ? void 0 : _c.headers) !== null && _d !== void 0 ? _d : {};
    const parameters = (_f = (_e = doc === null || doc === void 0 ? void 0 : doc.components) === null || _e === void 0 ? void 0 : _e.parameters) !== null && _f !== void 0 ? _f : {};
    // Check if Pagination schema is referenced but doesn't exist
    const needsPagination = yamlText.includes('$ref: "#/components/schemas/Pagination"') && !schemas.Pagination;
    console.log(`🔍 Pagination check: includes ref=${yamlText.includes('$ref: "#/components/schemas/Pagination"')}, schema exists=${!!schemas.Pagination}, needs=${needsPagination}`);
    // Check if x-correlation-id header is referenced but doesn't exist
    const needsCorrelationHeader = yamlText.includes('$ref: "#/components/headers/x-correlation-id"') && !headers['x-correlation-id'];
    // Check if generic parameters are referenced but don't exist
    const needsPaginationLimit = yamlText.includes('$ref: "#/components/parameters/PaginationLimit"') && !parameters.PaginationLimit;
    const needsPaginationOffset = yamlText.includes('$ref: "#/components/parameters/PaginationOffset"') && !parameters.PaginationOffset;
    const needsCorrelationId = yamlText.includes('$ref: "#/components/parameters/CorrelationId"') && !parameters.CorrelationId;
    return {
        pagination: needsPagination,
        correlationHeader: needsCorrelationHeader,
        paginationLimit: needsPaginationLimit,
        paginationOffset: needsPaginationOffset,
        correlationId: needsCorrelationId
    };
}
function generateMissingRefs(document, tag) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log(`🔧 generateMissingRefs called for tag: ${tag}`);
            const text = document.getText();
            console.log(`📄 Document length: ${text.length} characters`);
            const doc = yaml.parseDocument(text, { keepCstNodes: true });
            const edit = new vscode.WorkspaceEdit();
            // === Add tag definition if missing ===
            const tagsNode = doc.get("tags", true);
            if (tagsNode) {
                const parsedDoc = yaml.parse(text);
                const existingTags = (_a = parsedDoc === null || parsedDoc === void 0 ? void 0 : parsedDoc.tags) !== null && _a !== void 0 ? _a : [];
                const tagExists = existingTags.some((t) => t.name === tag);
                if (!tagExists && tagsNode.range) {
                    const tagInsertPos = document.positionAt(tagsNode.range[1]);
                    const tagEntry = `\n  - name: ${tag}
    description: |
      Operations regarding ${tag.toLowerCase()}s.`;
                    edit.insert(document.uri, tagInsertPos, tagEntry);
                }
            }
            const componentsNode = doc.get("components", true);
            // === Parameters ===
            const missingParams = findMissingParameterRefs(text);
            console.log(`🔍 Missing parameters: ${missingParams.join(', ') || 'none'}`);
            const expectedParam = `${tag}Id`;
            const expectedSortParam = `Sort.${(0, pluralize_1.default)(tag)}`;
            const parametersNode = componentsNode === null || componentsNode === void 0 ? void 0 : componentsNode.get("parameters", true);
            if (parametersNode === null || parametersNode === void 0 ? void 0 : parametersNode.range) {
                const insertPos = document.positionAt(parametersNode.range[1]);
                if (missingParams.includes(expectedParam)) {
                    const paramTemplatePath = path.join(__dirname, "../templates/parameter.yaml");
                    const paramTemplate = fs.readFileSync(paramTemplatePath, "utf-8");
                    const renderedParam = renderParameterTemplate(paramTemplate, tag);
                    edit.insert(document.uri, insertPos, `\n  ${renderedParam}\n`);
                }
                if (missingParams.includes(expectedSortParam)) {
                    const sortParamTemplatePath = path.join(__dirname, "../templates/parameter-sort.yaml");
                    const sortParamTemplate = fs.readFileSync(sortParamTemplatePath, "utf-8");
                    const renderedSortParam = renderSortParameterTemplate(sortParamTemplate, tag);
                    edit.insert(document.uri, insertPos, `\n  ${renderedSortParam}\n`);
                }
            }
            else {
                vscode.window.showErrorMessage("❌ No components.parameters section found.");
            }
            // === RequestBodies ===
            const missingBodies = findMissingRequestBodyRefs(text);
            console.log(`🔍 Missing requestBodies: ${missingBodies.join(', ') || 'none'}`);
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
            console.log(`🔍 Missing responses: ${missingResponses.join(', ') || 'none'}`);
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
            // Apply first edit batch if there are any entries
            if (edit.entries().length > 0) {
                yield vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage(`✅ Inserted missing $refs: ${[...missingParams, ...missingBodies].join(", ")}`);
            }
            // --- Second pass: SCHEMA refs from newly inserted content ---
            const updatedText = document.getText();
            const docAfter = yaml.parseDocument(updatedText, {
                keepCstNodes: true,
            });
            const componentsAfter = docAfter.get("components", true);
            const schemaEdit = new vscode.WorkspaceEdit();
            const missingSchemas = findMissingSchemaRefs(updatedText);
            // Check for generic components (Pagination, headers)
            const needsGenericComponents = checkForGenericComponents(updatedText);
            console.log(`🔍 Generic components needed:`, needsGenericComponents);
            // Add generic parameters if needed
            if (needsGenericComponents.paginationLimit || needsGenericComponents.paginationOffset || needsGenericComponents.correlationId) {
                const parametersNode = componentsAfter === null || componentsAfter === void 0 ? void 0 : componentsAfter.get("parameters", true);
                if (parametersNode === null || parametersNode === void 0 ? void 0 : parametersNode.range) {
                    const paramEdit = new vscode.WorkspaceEdit();
                    const paramInsertPos = document.positionAt(parametersNode.range[1]);
                    if (needsGenericComponents.correlationId) {
                        const correlationIdParam = `\n    CorrelationId:
      description: |
        An identifier to provide in order to track your request.
      in: header
      required: false
      name: x-correlation-id
      schema:
        type: string
        example: 661077bb-375f-4500-b5aa-0ef18807add6\n`;
                        paramEdit.insert(document.uri, paramInsertPos, correlationIdParam);
                    }
                    if (needsGenericComponents.paginationLimit) {
                        const paginationLimitParam = `\n    PaginationLimit:
      name: limit
      in: query
      required: false
      description: |
        Maximum number of items to return.
        If omitted, the server applies a default.
      schema:
        type: integer
        format: int32
        minimum: 1
        maximum: 200
        default: 20
        example: 20\n`;
                        paramEdit.insert(document.uri, paramInsertPos, paginationLimitParam);
                    }
                    if (needsGenericComponents.paginationOffset) {
                        const paginationOffsetParam = `\n    PaginationOffset:
      name: offset
      in: query
      required: false
      description: |
        Number of items to skip before starting to collect the result set.
      schema:
        type: integer
        format: int32
        minimum: 0
        default: 0
        example: 0\n`;
                        paramEdit.insert(document.uri, paramInsertPos, paginationOffsetParam);
                    }
                    yield vscode.workspace.applyEdit(paramEdit);
                    const genericParams = [];
                    if (needsGenericComponents.correlationId)
                        genericParams.push('CorrelationId');
                    if (needsGenericComponents.paginationLimit)
                        genericParams.push('PaginationLimit');
                    if (needsGenericComponents.paginationOffset)
                        genericParams.push('PaginationOffset');
                    vscode.window.showInformationMessage(`✅ Inserted generic parameters: ${genericParams.join(", ")}`);
                }
            }
            if (missingSchemas.length > 0 || needsGenericComponents.pagination || needsGenericComponents.correlationHeader) {
                // Re-parse document after parameter edits to get accurate positions
                const textAfterParams = document.getText();
                const docAfterParams = yaml.parseDocument(textAfterParams, {
                    keepCstNodes: true,
                });
                const componentsAfterParams = docAfterParams.get("components", true);
                const schemaNode = componentsAfterParams === null || componentsAfterParams === void 0 ? void 0 : componentsAfterParams.get("schemas", true);
                const headersNode = componentsAfterParams === null || componentsAfterParams === void 0 ? void 0 : componentsAfterParams.get("headers", true);
                // Separate edits for headers and schemas to avoid position conflicts
                const headerEdit = new vscode.WorkspaceEdit();
                const schemaEditFinal = new vscode.WorkspaceEdit();
                // Add x-correlation-id header if needed
                if (needsGenericComponents.correlationHeader && (headersNode === null || headersNode === void 0 ? void 0 : headersNode.range)) {
                    const headerInsertPos = document.positionAt(headersNode.range[1]);
                    const correlationHeader = `\n    x-correlation-id:
      description: |
        The x-correlation-id containing an identifier for a request.
      required: true
      schema:
        type: string
        format: uuid
        example: 661077bb-375f-4500-b5aa-0ef18807add6\n`;
                    headerEdit.insert(document.uri, headerInsertPos, correlationHeader);
                    yield vscode.workspace.applyEdit(headerEdit);
                }
                // Re-parse after header edit to get accurate schema positions
                const textAfterHeaders = document.getText();
                const docAfterHeaders = yaml.parseDocument(textAfterHeaders, {
                    keepCstNodes: true,
                });
                const componentsAfterHeaders = docAfterHeaders.get("components", true);
                const schemaNodeAfterHeaders = componentsAfterHeaders === null || componentsAfterHeaders === void 0 ? void 0 : componentsAfterHeaders.get("schemas", true);
                // Add Pagination schema if needed
                console.log(`🔍 Checking Pagination: needsGenericComponents.pagination=${needsGenericComponents.pagination}, schemaNodeAfterHeaders?.range=${(schemaNodeAfterHeaders === null || schemaNodeAfterHeaders === void 0 ? void 0 : schemaNodeAfterHeaders.range) ? 'exists' : 'missing'}`);
                if (needsGenericComponents.pagination && (schemaNodeAfterHeaders === null || schemaNodeAfterHeaders === void 0 ? void 0 : schemaNodeAfterHeaders.range)) {
                    console.log('✅ Inserting Pagination schema');
                    const schemaInsertPos = document.positionAt(schemaNodeAfterHeaders.range[1]);
                    const paginationSchema = `\n    Pagination:
      description: |
        Pagination metadata.
      type: object
      additionalProperties: false
      nullable: false
      required:
        - limit
        - offset
        - sort
        - hasNextPage
        - hasPreviousPage
        - currentPage
      properties:
        limit:
          type: integer
          format: int32
          nullable: false
          minimum: 1
        offset:
          type: integer
          format: int32
          nullable: false
          minimum: 0
        total:
          type: integer
          format: int32
          minimum: 0
          nullable: false
        sort:
          type: string
          nullable: false
          description: The applied sort token.
        hasNextPage:
          type: boolean
          nullable: false
        hasPreviousPage:
          type: boolean
          nullable: false
        currentPage:
          type: integer
          format: int32
          minimum: 1
          nullable: false
          description: 1-indexed page derived from offset/limit.
        totalPages:
          type: integer
          format: int32
          minimum: 1
          nullable: false`;
                    schemaEditFinal.insert(document.uri, schemaInsertPos, paginationSchema);
                    yield vscode.workspace.applyEdit(schemaEditFinal);
                }
                // Now handle entity-specific schemas
                if (missingSchemas.length > 0) {
                    // Re-parse to get updated positions after Pagination schema
                    const reUpdatedText = document.getText();
                    const docReUpdated = yaml.parseDocument(reUpdatedText, {
                        keepCstNodes: true,
                    });
                    const componentsReUpdated = docReUpdated.get("components", true);
                    const schemaNodeUpdated = componentsReUpdated === null || componentsReUpdated === void 0 ? void 0 : componentsReUpdated.get("schemas", true);
                    if (schemaNodeUpdated === null || schemaNodeUpdated === void 0 ? void 0 : schemaNodeUpdated.range) {
                        const entitySchemaEdit = new vscode.WorkspaceEdit();
                        const insertPos = document.positionAt(schemaNodeUpdated.range[1]);
                        const paginatedTemplate = fs.readFileSync(path.join(__dirname, "../templates/schema-paginated.yaml"), "utf-8");
                        const objectTemplate = fs.readFileSync(path.join(__dirname, "../templates/schema-object.yaml"), "utf-8");
                        const sortTemplate = fs.readFileSync(path.join(__dirname, "../templates/schema-sort.yaml"), "utf-8");
                        for (const name of missingSchemas) {
                            // Check if this is a Sort schema
                            if (name.startsWith("Sort.")) {
                                const rendered = renderSortSchemaTemplate(sortTemplate, tag);
                                entitySchemaEdit.insert(document.uri, insertPos, `\n${indentYamlBlock(rendered, 2)}`);
                            }
                            else {
                                const rendered = renderSchemaTemplates(paginatedTemplate, objectTemplate, name, tag);
                                entitySchemaEdit.insert(document.uri, insertPos, `\n${indentYamlBlock(rendered, 2)}`);
                            }
                        }
                        yield vscode.workspace.applyEdit(entitySchemaEdit);
                        // Re-check for generic components after entity schemas are added
                        const textAfterEntitySchemas = document.getText();
                        const needsGenericComponentsAfterEntity = checkForGenericComponents(textAfterEntitySchemas);
                        console.log(`🔍 Generic components needed after entity schemas:`, needsGenericComponentsAfterEntity);
                        // If Pagination is now needed (because entity schemas reference it), add it
                        if (needsGenericComponentsAfterEntity.pagination && !needsGenericComponents.pagination) {
                            const reReUpdatedText = document.getText();
                            const docReReUpdated = yaml.parseDocument(reReUpdatedText, {
                                keepCstNodes: true,
                            });
                            const componentsReReUpdated = docReReUpdated.get("components", true);
                            const schemaNodeReUpdated = componentsReReUpdated === null || componentsReReUpdated === void 0 ? void 0 : componentsReReUpdated.get("schemas", true);
                            if (schemaNodeReUpdated === null || schemaNodeReUpdated === void 0 ? void 0 : schemaNodeReUpdated.range) {
                                const paginationEdit = new vscode.WorkspaceEdit();
                                const paginationInsertPos = document.positionAt(schemaNodeReUpdated.range[1]);
                                const paginationSchema = `\n    Pagination:
      description: |
        Pagination metadata.
      type: object
      additionalProperties: false
      nullable: false
      required:
        - limit
        - offset
        - sort
        - hasNextPage
        - hasPreviousPage
        - currentPage
      properties:
        limit:
          type: integer
          format: int32
          nullable: false
          minimum: 1
        offset:
          type: integer
          format: int32
          nullable: false
          minimum: 0
        total:
          type: integer
          format: int32
          minimum: 0
          nullable: false
        sort:
          type: string
          nullable: false
          description: The applied sort token.
        hasNextPage:
          type: boolean
          nullable: false
        hasPreviousPage:
          type: boolean
          nullable: false
        currentPage:
          type: integer
          format: int32
          minimum: 1
          nullable: false
          description: 1-indexed page derived from offset/limit.
        totalPages:
          type: integer
          format: int32
          minimum: 1
          nullable: false\n`;
                                paginationEdit.insert(document.uri, paginationInsertPos, paginationSchema);
                                yield vscode.workspace.applyEdit(paginationEdit);
                                console.log('✅ Added Pagination schema after entity schemas');
                            }
                        }
                        const allGenerated = [...missingSchemas];
                        if (needsGenericComponents.pagination || needsGenericComponentsAfterEntity.pagination)
                            allGenerated.push('Pagination');
                        if (needsGenericComponents.correlationHeader)
                            allGenerated.push('x-correlation-id');
                        vscode.window.showInformationMessage(`✅ Inserted components: ${allGenerated.join(", ")}`);
                    }
                    else {
                        vscode.window.showErrorMessage("❌ No components.schemas section found.");
                    }
                }
                else if (needsGenericComponents.pagination || needsGenericComponents.correlationHeader) {
                    const genericAdded = [];
                    if (needsGenericComponents.pagination)
                        genericAdded.push('Pagination');
                    if (needsGenericComponents.correlationHeader)
                        genericAdded.push('x-correlation-id');
                    vscode.window.showInformationMessage(`✅ Inserted generic components: ${genericAdded.join(", ")}`);
                }
            }
            else if (edit.entries().length === 0) {
                // Nothing was generated at all
                vscode.window.showInformationMessage("✅ No missing $refs to insert.");
            }
        }
        catch (error) {
            console.error('❌ Error in generateMissingRefs:', error);
            vscode.window.showErrorMessage(`❌ Error generating components: ${error.message}`);
        }
    });
}
