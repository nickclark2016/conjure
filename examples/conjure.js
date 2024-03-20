workspace('ryujin', (wks) => {
    when({ system: 'Windows' }, (_) => {
        platforms(['Win32', 'x64']);
    });

    when({ system: 'Linux' }, (_) => {
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

onConfigure(() => {
    console.log('Configuring...');

    when({ system: 'windows' }, (ctx) => {
        fetchRemoteZip({
            url: 'https://github.com/shader-slang/slang/releases/download/v2024.1.4/slang-2024.1.4-win64.zip',
            files: ['bin/windows-x64/release/slangc.exe'],
            destination: './dependencies/slang/windows'
        });
    });

    when({ system: 'linux' }, (ctx) => {
        fetchRemoteZip({
            url: 'https://github.com/shader-slang/slang/releases/download/v2024.1.4/slang-2024.1.4-linux-x86_64.zip',
            files: ['bin/linux-x64/release/slangc'],
            destination: './dependencies/slang/linux'
        });
    });
});