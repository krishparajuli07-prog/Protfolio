FROM caddy:2.9-alpine@sha256:b4e3952384eb9524a887633ce65c752dd7c71314d2c2acf98cd5c715aaa534f0
# Port 8080 needs no capability. Remove the binary's privileged-port file cap.
RUN setcap -r /usr/bin/caddy
USER 100:101
