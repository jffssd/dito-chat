FROM 1.12.4-alpine3.9

ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

RUN apk add --no-cache ca-certificates \
    && mkdir /app

WORKDIR /app

COPY . .

RUN go get -d . && go build .

CMD [ "/app/backend" ]