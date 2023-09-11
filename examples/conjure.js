workspace('ryujin', (wks) => {
    when ({ system: 'windows' }, (_) => {
        platforms(['Win32', 'x64']);
    });

    when ({ system: 'linux' }, (_) => {
        platforms(['x64']);
    });

    configurations(['Debug', 'Release']);

    include('./library/conjure.js');
    include('./executable/conjure.js');

    block('common', (_) => {
        when({}, (ctx) => {
            targetDirectory(`${ctx.pathToWorkspace}/bin/${ctx.platform}/${ctx.configuration}`);
            intermediateDirectory(`${ctx.pathToWorkspace}/bin-int/${ctx.platform}/${ctx.configuration}/${ctx.project.getName()}`);
        });
    });
});