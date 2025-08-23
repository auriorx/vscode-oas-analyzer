"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPathTemplate = renderPathTemplate;
const pluralize_1 = __importDefault(require("pluralize"));
function kebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}
function renderPathTemplate(template, tag) {
    const tagPlural = pluralize_1.default.plural(tag);
    const tagLower = tag.toLowerCase();
    const tagPluralLower = tagPlural.toLowerCase();
    const tagKebab = kebab(tag);
    const tagKebabPlural = kebab(tagPlural);
    const tagKebabLower = kebab(tagLower);
    const tagKebabPluralLower = kebab(tagPluralLower);
    const replacements = {
        '{tag}': tag,
        '{tag-plural}': tagPlural,
        '{tag-kebab}': tagKebab,
        '{tag-kebab-lower}': tagKebabLower,
        '{tag-kebab-plural}': tagKebabPlural,
        '{tag-kebab-plural-lower}': tagKebabPluralLower,
    };
    let rendered = template;
    for (const [key, value] of Object.entries(replacements)) {
        rendered = rendered.split(key).join(value);
    }
    return rendered;
}
