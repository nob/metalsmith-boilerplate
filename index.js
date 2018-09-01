const Metalsmith = require('metalsmith')
const layouts = require('metalsmith-layouts')
const discoverPartials = require('metalsmith-discover-partials')
const discoverHelpers = require('metalsmith-discover-helpers')
const assets = require('metalsmith-static')
const sass = require('metalsmith-sass')
const markdown = require('metalsmith-markdown');
const dataMarkdown = require('metalsmith-data-markdown')
const browserSync = require('metalsmith-browser-sync')
const autoprefixer = require('metalsmith-autoprefixer')
const i18n = require('metalsmith-i18n')
const multiLanguage = require('metalsmith-multi-language')
const rootPath = require('metalsmith-rootpath')
const htmlMinifier = require('metalsmith-html-minifier')
const permalinks = require('metalsmith-permalinks')
const assetFunctions = require('node-sass-asset-functions')
const inlineSource = require('metalsmith-inline-source')
const debug = require('metalsmith-debug')

class BuildMetalsmith {
  constructor () {
    let watch = false;
    let prod = false;
    process.argv.forEach(function (val) {
      if (val === '--watch') {
        watch = true;
      } else {
        prod = true;
      }
    });

    this.build(watch)
    .then(() => {
      if (prod) {
        //do something in prod mode
      }
    });

  }

  build(watch = false) {
    return new Promise((resolve, reject) => {
      var metalsmith = Metalsmith(__dirname)
        .source('src')
        .destination('dist');
        if (watch) {
          metalsmith.use(browserSync({
            server : "dist",
            files  : ["src/**/*", "layouts/**/*", 'locales/**/*', 'assets/**/*']
          }))
        }
        metalsmith.clean(true)
        .use(sass({
          outputDir: 'css/',
          outputStyle: 'compressed',
          functions: assetFunctions({
            images_path: 'src/images',
          })
        }))
        .use(autoprefixer())
        .use(markdown())
        .use(dataMarkdown({
          removeAttributeAfterwards: true
        }))
        .use(i18n({
          default: 'en',
          locales: ['en', 'ja'],
          directory: 'locales'
        }))
        .use(multiLanguage({
          default: 'en',
          locales: ['en', 'ja']
        }))
        .use(permalinks({
          relative: false,
          pattern: ':locale/:slug/'
        }))
        .use(rootPath())
        .use(discoverPartials({
          directory: 'layouts/partials',
          pattern: /\.hbs$/
        }))
        .use(discoverHelpers({
          directory: 'layouts/helpers',
          pattern: /\.js$/
        }))
        .use(layouts({
          pattern: "**/*.html" //Not '**/*.md' here, Markdown files are already converted to HTML files.
        }))
        .use(inlineSource({
          rootpath: './src/'
        }))
        .use(htmlMinifier())
        .use(debug()) 
        .build((err) => {
          if (err) {
            reject(err);
            throw err;
          } else {
            resolve();
            console.log(`Successfully build metalsmith - ${new Date()}`);
          }
        })
    });
  }
}

new BuildMetalsmith();
