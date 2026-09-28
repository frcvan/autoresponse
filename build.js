const fs = require("fs");
const path = require("path");
const mjml2html = require("mjml");

const rootDir = __dirname;
const sourceIndexPath = path.join(rootDir, "index.js");
const templatePath = path.join(rootDir, "email.mjml");
const outputDir = path.join(rootDir, "out");
const outputIndexPath = path.join(outputDir, "index.js");
const outputEmailPath = path.join(outputDir, "email.html");

async function build() {
    const template = fs.readFileSync(templatePath, "utf8");
    const { html, errors = [] } = await mjml2html(template, {
        validationLevel: "strict"
    });

    if (errors.length > 0) {
        throw new Error(
            `MJML validation failed:\n${errors
                .map((error) => error.formattedMessage)
                .join("\n")}`
        );
    }

    const sourceIndex = fs.readFileSync(sourceIndexPath, "utf8");
    const userHtmlBodyMarker = '"__USER_HTML_BODY__"';
    const markerOccurrences = sourceIndex.split(userHtmlBodyMarker).length - 1;

    if (markerOccurrences !== 1) {
        throw new Error(
            `Expected exactly one userHtmlBody marker in index.js, found ${markerOccurrences}`
        );
    }

    const generatedIndex = sourceIndex.replace(
        userHtmlBodyMarker,
        JSON.stringify(html)
    );

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputEmailPath, html);
    fs.writeFileSync(outputIndexPath, generatedIndex);
    console.log(
        `Built ${path.relative(rootDir, outputEmailPath)} and ${path.relative(
            rootDir,
            outputIndexPath
        )}`
    );
}

build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
