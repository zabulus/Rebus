module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      all: {
        options: {
          force: true
        },
        src: ['../bin/Debug/Web']
      }
    },
    browserify: {
      libs: {
        options: {
          debug: false,
          shim: {
            jquery: {
              alias: 'jquery',
              path: './bower_components/jquery/jquery.js',
              exports: '$'
            },
            angular: {
              alias: 'angular',
              path: './bower_components/angular/angular.js',
              exports: 'angular',
              depends: {
                jquery: '$'
              }
            },
            'angular_animate': {
              alias: 'angular-animate',
              path: './bower_components/angular-animate/angular-animate.js',
              exports: 'angular_animate',
              depends: {
                angular: 'angular'
              }
            }
          },
        },
        src: [],
        dest: 'build/libs.js',
      },
      app: {
        options: {
          debug: true,
          external: [
            'jquery',
            'angular',
            'angular_animate'
          ]
        },
        src: ['app.js'],
        dest: 'build/app.js',
      }
    },
    concat: {
      app: {
        src: ['css/reset.css', 'css/*.css'],
        dest: 'build/app.css',
      }
    },
    copy: {
      all: {
        expand: true,
        flatten: true,
        cwd: '',
        src: ['index.html', 'favicon.ico', 'build/*', 'resources/*'],
        dest: '../bin/Debug/Web',
      }
    },
    watch: {
      libs: {
        files: ['bower_components/**/*', 'Gruntfile.js'],
        tasks: ['all'],
        options: {
          interrupt: true
        }
      },
      app: {
        files: ['js/*', 'css/*', './*'],
        tasks: ['default'],
        options: {
          interrupt: true
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['clean', 'browserify:app', 'concat', 'copy']);
  grunt.registerTask('all', ['clean', 'browserify', 'concat', 'copy']);
};