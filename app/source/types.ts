
export interface EdgarServer {
    background: string;
    name: string;
    message: string;
    link: string;
    address: string;
    pingDomain: string;
    tableDomain: string;
    localhost: boolean;
}

export interface EdgarCredentials {
    username: string;
    password: string;
    host: string;
}

export interface EdgarAppDescription {
    name: string;
    description: string[];
    website: string;
    github: string;
}

export interface EdgarExtension {
    (config: EdgarConfig, router: any, root: string): void;
}

export interface EdgarDomainDescription {
    domain: string;
    folder: string;
    description: string;
    server?: string;
}

export interface EdgarServerDescription {
    name: string;
    script: string;
    port: number;
    options: string[];
}

export interface EdgarConfig {
    port: number;
    server: EdgarServer;
    credentials: EdgarCredentials;
    applications: EdgarAppDescription[];
    domains: EdgarDomainDescription[];
    servers: EdgarServerDescription[];
}