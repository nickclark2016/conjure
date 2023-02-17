import { arch, platform } from "os";

export enum System {
    Android = 'android',
    AIX = 'aix',
    BSD = 'bsd',
    Darwin = 'darwin',
    Linux = 'linux',
    SunOS = 'sunos',
    Windows = 'windows'
};

export enum Architecture {
    x86 = 'x86',
    x64 = 'x86_64',
    ARM = 'arm',
    ARM64 = 'arm64',
    MIPS = 'mips',
    POWERPC = 'ppc',
    POWERPC_64 = 'ppc64',
    S390 = 's390',
    S390X = 's390x'
};

export class Host {
    static system(): System {
        const plat = platform();
        switch (plat) {
            case 'android':
                return System.Android;
            case 'aix':
                return System.AIX;
            case 'darwin':
                return System.Darwin;
            case 'freebsd':
            case 'openbsd':
                return System.BSD;
            case 'linux':
                return System.Linux;
            case 'sunos':
                return System.SunOS;
            case 'win32':
                return System.Windows;
        }
        
        throw new Error(`Host OS [${plat}] unsupported.`);
    }

    static architecture(): Architecture {
        const architecture = arch();
        switch (architecture) {
            case 'arm':
                return Architecture.ARM;
            case 'arm64':
                return Architecture.ARM64;
            case 'ia32':
                return Architecture.x86;
            case 'mips':
            case 'mipsel':
                return Architecture.MIPS;
            case 'ppc':
                return Architecture.POWERPC;
            case 'ppc64':
                return Architecture.POWERPC_64;
            case 's390':
                return Architecture.S390;
            case 's390x':
                return Architecture.S390X;
            case 'x64':
                return Architecture.x64;
        }

        throw new Error(`Host architecture [${architecture}] unsupported.`);
    }
}