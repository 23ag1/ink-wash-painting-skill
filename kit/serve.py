"""Static dev server with caching disabled, so edited ES modules and shaders always reload.

Serves the current working directory (or the folder given as the second argument), so a project and its kit/
are both reachable. Usage: python3 kit/serve.py [port] [root]   (default 8770, cwd)
"""
import functools
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    root = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.getcwd()
    handler = functools.partial(NoCache, directory=root)
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
