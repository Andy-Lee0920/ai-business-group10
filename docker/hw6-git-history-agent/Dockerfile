FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul

RUN apt-get update && apt-get install -y \
    git \
    bash \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY run-daily-git-history.sh /usr/local/bin/run-daily-git-history.sh
RUN chmod +x /usr/local/bin/run-daily-git-history.sh

WORKDIR /workspace

CMD ["/usr/local/bin/run-daily-git-history.sh"]
