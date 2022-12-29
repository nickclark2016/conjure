workspace('premake-next', (wks) => {
    platforms(['x86', 'x64']);
    project('premake', (prj) => {
        platforms(['x86', 'x64']);
    });
});