const glob = require('glob')
const handlebars = require('handlebars')
const Metalsmith = require('metalsmith')
const layouts = require('metalsmith-layouts')
const discoverPartials = require('metalsmith-discover-partials')
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

class BuildMetalsmith {
  constructor () {
    this.prepareHandlebarsHelper();
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
            files  : ["src/**/*", "layouts/**/*.hbs", "partials/**/*.hbs", 'locales/**/*', 'assets/**/*']
          }))
        }
        metalsmith.clean(true)
        .use(sass({
          outputStyle: 'compressed',
          functions: assetFunctions({
            images_path: 'src/assets',
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
          directory: 'partials',
          pattern: /\.hbs$/
        }))
        .use(layouts({
          pattern: "**/*.html"
        }))
        .use(inlineSource({
          rootpath: './src/'
        }))
        .use(htmlMinifier())
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

  prepareHandlebarsHelper () {
    // add custom helpers to handlebars
    // https://github.com/superwolff/metalsmith-layouts/issues/63
    //
    // using the global handlebars instance
    glob.sync(`${__dirname}/helpers/*.js`).forEach((fileName) => {
      const helper = fileName.split('/').pop().replace('.js', '')

      handlebars.registerHelper(
        helper,
        require(fileName)
      )
    })
  }
}

new BuildMetalsmith();
