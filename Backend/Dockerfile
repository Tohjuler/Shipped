FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb
COPY tsconfig.json tsconfig.json

RUN bun install --production

COPY ./src ./src

ENV NODE_ENV=production

RUN bun run build

FROM alpine:3.21.0 AS git
RUN apk add --no-cache \
        zlib-dev \
        openssl-dev \
        curl-dev \
        curl \
        expat-dev \
        perl-dev \
        python3-dev \
        pcre2-dev \
        asciidoc \
        xmlto \
        perl-error \
        tcl \
        tk \
        make \
        gcc \
        g++
WORKDIR /src
ARG gitversion=2.34.1
RUN curl --output git-${gitversion}.tar.gz \
         https://mirrors.edge.kernel.org/pub/software/scm/git/git-${gitversion}.tar.gz && \
    tar -xvzf git-${gitversion}.tar.gz
RUN export TO=/git && \
    mkdir -p ${TO} && \
    cd git-${gitversion} && \
    make prefix=/usr DESTDIR=${TO} NO_GETTEXT=YesPlease NO_REGEX=YesPlease ICONV_OMITS_BOM=Yes && \
    make prefix=/usr DESTDIR=${TO} NO_GETTEXT=YesPlease NO_REGEX=YesPlease ICONV_OMITS_BOM=Yes strip && \
    make prefix=/usr DESTDIR=${TO} NO_GETTEXT=YesPlease NO_REGEX=YesPlease ICONV_OMITS_BOM=Yes install && \
    # remove files that aren't part of standard package
    rm -f /git/usr/libexec/git-core/git-cvs* && \
    rm -f /git/usr/libexec/git-core/git-daemon && \
    rm -f /git/usr/libexec/git-core/git-fast-import && \
    rm -f /git/usr/libexec/git-core/git-http-backend && \
    rm -f /git/usr/libexec/git-core/git-instaweb && \
    rm -f /git/usr/libexec/git-core/git-remote-testsvn && \
    rm -f /git/usr/libexec/git-core/git-shell && \
    rm -f /git/usr/libexec/git-core/git-svn && \
    rm -f /git/usr/libexec/git-core/*p4* && \
    rm -f /git/usr/libexec/git-core/mergetools/*p4* && \
    rm -f /git/usr/libexec/git-core/*email* && \
    rm -f /git/usr/libexec/git-core/*imap*

FROM debian:bullseye-slim

WORKDIR /app

# Copy git
COPY --from=git /git/usr/ /usr/

COPY drizzle drizzle

COPY --from=build /app/server server
RUN chmod +x /app/server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 5055