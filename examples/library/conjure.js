group('group with space', (_) => {
    project('library', (prj) => {
        language('C++');
        languageVersion('C++20');
        toolset('gcc');
        kind('StaticLib');
        files([ '*/**.hpp', '*/**.cpp', '*/**.ixx' ]);

        when({ configuration: 'Debug' }, (ctx) => {
            symbols('On');
            optimize('Off');

            targetDirectory(`${ctx.pathToWorkspace}/bin/${ctx.platform}/${prj.name}/${ctx.configuration}`);
            intermediateDirectory(`${ctx.pathToWorkspace}/bin-int/${ctx.platform}/${prj.name}/${ctx.configuration}`);
        });

        when({ configuration: 'Release' }, (ctx) => {
            symbols('Off');
            optimize('On');

            targetDirectory(`${ctx.pathToWorkspace}/bin/${ctx.platform}/${prj.name}/${ctx.configuration}`);
            intermediateDirectory(`${ctx.pathToWorkspace}/bin-int/${ctx.platform}/${prj.name}/${ctx.configuration}`);
        });

        when({ system: 'windows' }, (_) => {
            files([
                'win.cpp'
            ]);
        });

        block('library:public', (ctx) => {
            includeDirs([
                './includes'
            ]);

            when({ configuration: 'Release' }, (ctx) => {
                files([ './includes/dummy.h' ]);
            });
        });

        uses([
            'library:public'
        ]);
    });
});