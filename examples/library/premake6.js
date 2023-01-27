group('group', (grp) => {
    project('library', (prj) => {
        language('C++');
        toolset('msc:143');
        kind('StaticLib');
        files([ '**.cpp', '**.ixx' ]);

        when({ configuration: 'Debug' }, (ctx) => {
            symbols('On');
            optimize('Off');
        });

        when({ configuration: 'Release' }, (ctx) => {
            symbols('Off');
            optimize('On');
        });

        block('library:public', (ctx) => {
            includeDirs([
                './includes'
            ]);
        });

        uses([
            'library:public'
        ]);
    });
});