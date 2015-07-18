var gulp = require('gulp'),
	uglify = require("gulp-uglify"),
    jshint = require("gulp-jshint"),
    rename = require('gulp-rename');

gulp.task('clean', function() {
  return gulp.src(['dist/'], {read: false})
      .pipe(clean());
});

gulp.task('jshint', function () {
    return gulp.src('src/screenSlider.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('uglify',function(){
	return gulp.src('src/screenSlider.js')
			 .pipe(gulp.dest('dist'))
			 .pipe(rename({suffix:'min'}))
			 .pipe(gulp.dest('dist'))
});

gulp.task('default', ['jshint','uglify']);


