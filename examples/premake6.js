workspace('ryujin', (wks) => {
    platforms(['Win32', 'x64']);
    configurations(['Debug', 'Release']);

    include('./library/premake6.js');
    include('./executable/premake6.js');
});