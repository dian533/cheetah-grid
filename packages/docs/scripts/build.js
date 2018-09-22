'use strict';
const path = require('path');
const Metalsmith = require('metalsmith');
const collections = require('metalsmith-collections');
const layouts = require('metalsmith-layouts');
const watch = require('metalsmith-watch');
//const markdown = require('metalsmith-markdown');
//const permalinks = require('metalsmith-permalinks');
const inPlace = require('metalsmith-in-place');
const codeHighlight = require('./metalsmith/metalsmith-code-highlight');
const textContents = require('./metalsmith/metalsmith-text-contents');
const babel = require('./metalsmith/metalsmith-babel');
const i18n = require('./metalsmith/metalsmith-i18n-files');
const mstatic = require('metalsmith-static');

const registerHbsPartials = require('./handlebars/register-partials');
const registerHbsHelpers = require('./handlebars/helpers');

const {
	isEnabledVersion,
	getDocumentVersion,
	getFailbackVersion,
	packageVersion,
	packageVersionX,
	watchMode,
	devMode} = require('./buildcommon');

const hbs = {
	directory: '../hbs/layouts',
	partials: '../hbs/partials',
};

registerHbsPartials({
	dirname: __dirname,
	partialsPath: hbs.partials,
});
registerHbsHelpers();

const demos = {
	allDemos: {
		pattern: 'demos/**/*.html*',
		sortBy: 'order'
	},
};
const docScript = require('../src/script/script');

Metalsmith(__dirname).//eslint-disable-line new-cap

	metadata({
		demoCategorys: [
			'Introduction',
			'Usage',
			'Usage Vue Component',
			'FAQ',
		],
		script: docScript,
		packageVersion,
		packageVersionX,
		docLinkVersion: getDocumentVersion(),
		failbackVersion: getFailbackVersion(),
		debug: watchMode || devMode,
	}).
	source('../src').
	destination(`../../../docs/${getDocumentVersion()}`).

	clean(true).
	use(watchMode ? watch({
		paths: {
			'${source}/**/*': true,
			'${source}/*': true,
		},
		livereload: true,
	}) : (files, metalsmith, done) => done()).
	use(mstatic({
		src: path.relative(path.resolve(__dirname), require.resolve('highlight.js/styles/kimbie.dark.css')),
		dest: 'css/highlightjs.css'
	})).
	// use(assets(
	// )).
	use(layouts({
		engine: 'handlebars',
		directory: hbs.directory,
		partials: hbs.partials,
		pattern: ['**/*.dummy'],
		suppressNoFilesError: true,
	})).
	use((files, metalsmith, done) => {
		// 非表示ドキュメントはdisabledフラグを立てる
		Object.keys(files).forEach((file) => {
			const data = files[file];
			if (data.docVersion) {
				if (!isEnabledVersion(data.docVersion)) {
					data.disabled = true;
				}
			}
			if (data.docAbolishedVersion) {
				if (isEnabledVersion(data.docAbolishedVersion)) {
					data.disabled = true;
				}
			}
		});
		done();
	}).
	use(i18n()).
	use(collections(demos)).
	use(textContents({
		demos: 'demos/**/*.parts*'
	})).
	use(textContents({
		demos: 'demos/*.parts*'
	})).
	use(inPlace({
		pattern: '*.hbs',
	})).
	use(inPlace({
		pattern: '**/*.hbs',
	})).
	use(layouts({
		engine: 'handlebars',
		directory: hbs.directory,
		// partials: hbs.partials,
		// pattern: ['**/*.html', '**/*.svg'],
		pattern: '**/*.html',
		engineOptions: {
			cache: false
		}
		// default: '{{{contents}}}',
	})).
	use(codeHighlight()).
	use(babel()).
	build((err) => {
		if (err) { throw err; } // error handling is required
	});


