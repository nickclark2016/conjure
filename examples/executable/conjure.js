project('executable', (prj) => {
    language('C++');
    kind('Executable');
    dependsOn(['library']);

    when({ system: 'Windows' }, (_) => {
        toolset('msc:143');
        subsystem('Console');
    });

    when({ system: 'Linux' }, (_) => {
        toolset('clang');
    });

    files([ 'main.cpp' ]);

    when({ configuration: 'Debug' }, (ctx) => {
        symbols('On');
        optimize('Off');
    });

    when({ configuration: 'Release' }, (ctx) => {
        symbols('Off');
        optimize('On');
    });

    when({ system: 'windows' }, (ctx) => {
        files([ 'windows.cpp' ]);
    });

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

    when({ toolset: 'msc' }, (_) => {
        console.log('Hello, MSC!');
    });

    uses([ 'library:public', 'example' ]);

    preBuildEvents([
        'echo "Pre-build event..."'
    ]);

    preLinkEvents([
        'echo "Pre-Link event..."'
    ]);

    postBuildEvents([
        'echo "Post-Build event..."'
    ]);
});