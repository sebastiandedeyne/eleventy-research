const cheerio = require("cheerio");

exports.render = function (data) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
      </head>
      <body>
        <h1>${data.title}</h1>
        ${linkifyReferences(data.content)}
        ${renderLinkedReferences(data)}
      </body>
    </html>
  `;
};

function linkifyReferences(html) {
  return html.replace(/\[\[([^\]]+)\]\]/g, (_, contents) => {
    const slug = contents.toLowerCase().replace(/\s/g, "-");

    return `<a href="/pages/${slug}">${contents}</a>`;
  });
}

function renderLinkedReferences(data) {
  const linkedReferences = data.collections.all
    .map((item) => {
      const $ = cheerio.load(item.data.content);

      const blocks = $("p")
        .filter((_, element) => {
          return $(element)
            .text()
            .match(new RegExp(`\\[\\[${data.title}\\]\\]`, "i"));
        })
        .map((_, block) => {
          return $.html(block);
        })
        .toArray();

      return { item, blocks };
    })
    .filter(({ item, blocks }) => {
      if (item.data === data) {
        return false;
      }

      return blocks.length > 0;
    });

  const count = linkedReferences.reduce(
    (sum, { blocks }) => sum + blocks.length,
    0
  );

  if (!count) {
    return "";
  }

  return `
    <h2>
      ${count} Linked Reference${count === 1 ? "" : "s"}
    </h2>
    <ul>
      ${linkedReferences
        .map(
          ({ item, blocks }) => `
          <li>
            <a href="${item.data.page.url}">
              ${item.data.title}
            </a>
            <ul>
              ${blocks
                .map((block) => `<li>${linkifyReferences(block)}</li>`)
                .join("")}
            </ul>
          </li>
        `
        )
        .join("")}
    </ul>
  `;
}
