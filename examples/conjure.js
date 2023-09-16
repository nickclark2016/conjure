workspace('ryujin', (wks) => {
    platforms(['Win32', 'x64']);
    configurations(['Debug', 'Release']);

    block('example', (_) => {
        when({}, (ctx) => {
            
        });
    });

    include('./library/conjure.js');
    include('./executable/conjure.js');
});