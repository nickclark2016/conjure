workspace('ryujin', (wks) => {
    platforms(['Win32', 'x64']);
    configurations(['Debug', 'Release']);

    include('./library/conjure.js');
    include('./executable/conjure.js');
});