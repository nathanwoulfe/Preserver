import gulp from 'gulp';
import del from 'del';
import globby from 'globby';
import through from 'through2';
import log from 'gulplog';
import sourcemaps from 'gulp-sourcemaps';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import embedTemplates from 'gulp-angular-embed-templates';

//paths
const urls = {
    js: 'src/Preserver/backoffice/*.js',
    html: 'src/Preserver/backoffice/*.html',
    css: 'src/Preserver/backoffice/*.css',
    lang: 'src/Preserver/lang/*.xml',
    manifest: 'src/Preserver/package.manifest',
    dest: './dist/App_Plugins/Preserver',
    dev: '../Umbraco-CMS/src/Umbraco.Web.UI/App_Plugins/Preserver'
};

//config
const config = {
    prod: process.argv.indexOf('--prod') > -1
};

function to(path) {
    const to = config.prod ? urls.dest : urls.dev;
    return path ? to + '/' + path : to;
 }

function clean() {
    return del([`${urls.dest}/**`, `${urls.dev}/**`], { force: true });
}

function js() {
    // gulp expects tasks to return a stream, so we create one here.
    var bundledStream = through();
    bundledStream
        // turns the output bundle stream into a stream containing
        // the normal attributes gulp plugins expect.
        .pipe(source('preserver.min.js'))

        // the rest of the gulp task, as you would normally write it.
        // here we're copying from the Browserify + Uglify2 recipe.
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        // Add gulp plugins to the pipeline here.
        .pipe(embedTemplates({
            basePath: './'
        }))
        .on('error', log.error)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(to('backoffice')));

    // "globby" replaces the normal "gulp.src" as Browserify
    // creates it's own readable stream.
    globby(urls.js).then(entries => {
        // create the Browserify instance.
        const b = browserify({
            entries: entries,
            debug: !config.prod,
            transform: [babelify]
        });

        // pipe the Browserify stream into the stream we created earlier
        // this starts our gulp pipeline.
        b.bundle()
            .pipe(bundledStream);
    }).catch(err => bundledStream.emit('error', err));

    // finally, we return the stream, so gulp knows when this task is done.
    return bundledStream;
}

function manifest() {
    return gulp.src(urls.manifest)
        .pipe(gulp.dest(to()))
}

function html() {
    return gulp.src(urls.html)
        .pipe(gulp.dest(to('backoffice')))
}

function lang() {
    return gulp.src(urls.lang)
        .pipe(gulp.dest(to('lang')))
}

function css() {
    return gulp.src(urls.css)
        .pipe(gulp.dest(to('backoffice')))
}

export const dev = gulp.task('dev',
    gulp.series(clean,
        gulp.parallel(
            js,
            html,
            css,
            lang,
            manifest,
            done => {
                console.log('starting watchers');
                gulp.watch(urls.js, js);
                gulp.watch(urls.html, html);
                gulp.watch(urls.css, css);
                gulp.watch(urls.lang, lang);
                gulp.watch(urls.manifest, manifest);

                done();
            }
        )));

export const build = gulp.task('build',
    gulp.series(clean,
        gulp.parallel(
            js,
            html,
            css,
            lang,
            manifest
        )));