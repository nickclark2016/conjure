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
});