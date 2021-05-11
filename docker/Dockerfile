FROM tomcat:8.5.34-jre8-alpine

ENV WAIT_FOR_DB_CONTAINER=""
ENV DHIS2_HOME=/DHIS2_home

RUN rm -rf /usr/local/tomcat/webapps/* && \
    mkdir /usr/local/tomcat/webapps/ROOT && \
    mkdir $DHIS2_HOME && \
    addgroup -S tomcat && \
    addgroup root tomcat && \
    adduser -S -D -G tomcat tomcat && \
    echo 'tomcat' >> /etc/cron.deny && \
    echo 'tomcat' >> /etc/at.deny

RUN apk add --update --no-cache \
        bash  \
        su-exec \
        fontconfig \
        ttf-dejavu

COPY ./config/tomcat/wait-for-it.sh /usr/local/bin/
COPY ./config/tomcat/docker-entrypoint.sh /usr/local/bin/

RUN chmod +rx /usr/local/bin/docker-entrypoint.sh && \
    chmod +rx /usr/local/bin/wait-for-it.sh

COPY ./config/tomcat/conf/server.xml /usr/local/tomcat/conf
COPY ./dhis.war /usr/local/tomcat/webapps/ROOT.war

USER 1001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["catalina.sh", "run"]