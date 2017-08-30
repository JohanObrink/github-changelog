const gulp = require('gulp')
const eslint = require('gulp-eslint')
const mocha = require('gulp-mocha')

const running = {}
const watching = {}

gulp.task('lint', () => {
  running.lint = ['gulpfile.js', 'lib/**/*.js', 'test/**/*.js']
  return gulp.src(running.lint)
    .pipe(eslint())
    .pipe(eslint.format())
})

gulp.task('test', () => {
  running.test = ['test/**/*.js', 'lib/**/*.js']
  return gulp.src(running.test[0])
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('watch', () => {
  return Promise.all(Object.keys(running)
    .filter(key => !watching[key])
    .map(key => {
      watching[key] = true
      return gulp.watch(running[key], [key])
    }))
})
