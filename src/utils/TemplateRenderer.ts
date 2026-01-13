import pluralize from 'pluralize';

function kebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function camelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function renderPathTemplate(template: string, tag: string): string {
  const tagPlural = pluralize.plural(tag);
  const tagCamel = camelCase(tag);
  const tagLower = tag.toLowerCase();
  const tagPluralLower = tagPlural.toLowerCase();
  const tagKebab = kebab(tag);
  const tagKebabPlural = kebab(tagPlural);
  const tagKebabLower = kebab(tagLower);
  const tagKebabPluralLower = kebab(tagPluralLower);

  const replacements: Record<string, string> = {
    '{tag}': tag,
    '{tag-plural}': tagPlural,
    '{tag-camel}': tagCamel,
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
