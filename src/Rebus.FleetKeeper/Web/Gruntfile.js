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
            signalr: {
              path: './lib/jquery.signalR-2.0.0-beta2.js',
              exports: 'signalR',
              depends: {
                jquery: '$'
              }
            },
            angular: {
              alias: 'angular',
              path: './bower_components/angular/angular.js',
              exports: 'angular',
              depends: {
                jquery: '$'
              }
            }
          }
        },
        src: ['lib/*.js'],
        dest: 'build/libs.js',
      },
      app: {
        options: {
          debug: true,
          alias: [
            './bower_components/jquery/jquery.js:jquery',
            './bower_components/angular/angular.js:angular',
          ],
          external: [
            //'./build/libs.js',
            './bower_components/jquery/jquery.js',
            './bower_components/angular/angular.js'
          ]
        },
        src: ['js/*.js'],
        dest: 'build/app.js',
      }
    },
    copy: {
      all: {
        expand: true,
        flatten: true,
        cwd: '',
        src: ['index.html', 'favicon.ico', 'css/*.css', 'build/*.js'],
        dest: '../bin/Debug/Web',
      }
    },
    watch: {
      libs: {
        files: ['lib/*', 'bower_components/**/*', 'Gruntfile.js'],
        tasks: ['all'],
        options: {
          interrupt: true
        }
      },
      app: {
        files: ['js/*', './*'],
        tasks: ['default'],
        options: {
          interrupt: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');  
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['clean', 'browserify:app', 'copy']);
  grunt.registerTask('all', ['clean', 'browserify', 'copy']);
};