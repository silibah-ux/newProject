#!/usr/bin/env python3
"""Serve the browser prototype on IPv4 and IPv6."""

import argparse
import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--directory", default=".")
    args = parser.parse_args()
    os.chdir(args.directory)
    server = DualStackServer(("::", args.port), SimpleHTTPRequestHandler)
    print(f"http://127.0.0.1:{args.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
