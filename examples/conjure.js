workspace('ryujin', (wks) => {
    when({system: 'Windows'}, (_) => {
        platforms(['Win32', 'x64']);
    });

    when({system: 'Linux'}, (_) => {
        platforms(['x64']);
    });

    configurations(['Debug', 'Release']);

    block('example', (_) => {
        when({}, (ctx) => {
            
        });
    });

    include('./library/conjure.js');
    include('./executable/conjure.js');
});