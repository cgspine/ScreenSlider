var gulp = require('gulp'),
	  uglify = require("gulp-uglify"),
    jshint = require("gulp-jshint"),
    rename = require('gulp-rename'),
		clean = require('gulp-clean');

gulp.task('clean', function() {
  return gulp.src(['dist/*'], {read: false})
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
			 .pipe(uglify())
			 .pipe(rename({suffix:'.min'}))
			 .pipe(gulp.dest('dist'))
});

gulp.task('default', ['clean','jshint','uglify']);
