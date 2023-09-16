group('group', (grp) => {
    project('library', (prj) => {
        language('C++');
        languageVersion('C++20');
        toolset('msc:143');
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

        when({ toolset: 'clang' }, () => {
            includeDirs([
                './ClangInc'
            ]);
        })

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