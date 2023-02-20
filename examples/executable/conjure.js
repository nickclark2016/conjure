project('executable', (prj) => {
    language('C++');
    toolset('msc:143');
    kind('ConsoleApp');

    dependsOn(['library']);
    files([ 'main.cpp' ]);

    when({ configuration: 'Debug' }, (ctx) => {
        symbols('On');
        optimize('Off');
    });

    when({ configuration: 'Release' }, (ctx) => {
        symbols('Off');
        optimize('On');
    });

    uses([ 'library:public' ]);
});