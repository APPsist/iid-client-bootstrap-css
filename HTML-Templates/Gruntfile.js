module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            dev: {
                options: {
                    sourceMap: true,
                    dumpLineNumbers: 'comments',
                    relativeUrls: true,
                    plugins: [
                            new (require('less-plugin-autoprefix'))({ browsers: ["last 2 versions"] })
                    ]
                },
                files: {
                    //'Content/css/appsist.debug.css': 'Content/appsist.less',
					'D:/dev/appsist_dev/GUI-CSS/css/appsist.debug.css': './appsist.less',

                }
            },
            production: {
                options: {
                    compress: true,
                    relativeUrls: true,
                    plugins: [
                            new (require('less-plugin-autoprefix'))({ browsers: ["last 2 versions"] })
                    ]
                },
                files: {
                   // 'Content/css/appsist.css': 'Content/appsist.less',
                    'D:/dev/appsist_dev/GUI-CSS/css/appsist.css': './appsist.less',
                }
            }
        },

    });

    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('default', ['less']);
    grunt.registerTask('production', ['less:production']);
    grunt.registerTask('dev', ['less:dev']);
};