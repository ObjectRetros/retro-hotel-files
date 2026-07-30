#!/usr/bin/env python3
"""Serve the local hotel assets with the CORS headers Nitro requires."""

from argparse import ArgumentParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NitroAssetHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8081)
    args = parser.parse_args()

    asset_root = Path(__file__).resolve().parent
    handler = lambda *handler_args, **handler_kwargs: NitroAssetHandler(
        *handler_args, directory=str(asset_root), **handler_kwargs
    )

    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Serving {asset_root} at http://{args.bind}:{args.port}/")
        server.serve_forever()


if __name__ == "__main__":
    main()
