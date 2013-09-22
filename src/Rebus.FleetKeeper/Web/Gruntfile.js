module.exports = function(grunt) {

  // Project configuration.
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
          shim: {
            angular: {
              path: './bower_components/angular/angular.js',
              exports: 'angular'
            }
          }
        },
        src: ['lib/*.js'],
        dest: '../bin/Debug/Web/libs.js',
      },
      app: {
        options: {
          alias: [
            './bower_components/angular/angular.js:angular'
          ],
          external: [
            './bower_components/angular/angular.js'
          ]
        },
        src: ['js/*.js'],
        dest: '../bin/Debug/Web/app.js',
      }
    },
    copy: {
      all: {
        expand: true,
        flatten: true,
        cwd: '',
        src: ['index.html', 'favicon.ico', 'css/*.css'],
        dest: '../bin/Debug/Web',
      }
    },
    watch: {
      libs: {
        files: ['<%= browserify.libs.src %>'],
        tasks: ['all'],
        options: {
          interrupt: true
        }
      },
      app: {
        files: ['<%= browserify.app.src %>', '<%= copy.app.src %>'],
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