FROM ubuntu:18.04

ENV TOMCAT_URL=https://apache.uib.no/tomcat/tomcat-8/v8.5.65/bin/apache-tomcat-8.5.65.tar.gz \
    CATALINA_HOME=/opt/tomcat \
    CATALINA_BASE=/opt/tomcat-dhis \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    DHIS2_HOME=/opt/dhis2

WORKDIR ${CATALINA_HOME}

RUN apt-get -y update &&\
    apt install -y openjdk-8-jdk wget locales &&\
    locale-gen en_US.UTF-8 &&\
    wget ${TOMCAT_URL} -O /tmp/apache-tomcat.tar.gz &&\
    mkdir -p ${CATALINA_HOME}/logs && chmod o+rx ${CATALINA_HOME}/logs &&\
    tar xvfz /tmp/apache-tomcat.tar.gz -C ${CATALINA_HOME}/ &&\
    mv apache*/* . &&\
    rm -rf apache-* &&\
    mkdir ${CATALINA_BASE} &&\
    mkdir ${CATALINA_BASE}/webapps &&\
    mkdir ${CATALINA_BASE}/temp &&\ 
    mkdir ${CATALINA_BASE}/conf &&\ 
    mkdir ${CATALINA_BASE}/logs && chmod o+rx ${CATALINA_BASE}/logs &&\
    cp -rf ${CATALINA_HOME}/conf/* ${CATALINA_BASE}/conf/ &&\
    rm -rf /tmp/*

ENV DHIS2_WAR=dhis.war
COPY ${DHIS2_WAR} ${CATALINA_BASE}/webapps/ROOT.war

COPY config/tomcat/conf/server.xml ${CATALINA_BASE}/conf/server.xml
COPY config/tomcat/setenv.sh ${CATALINA_BASE}/bin/setenv.sh

EXPOSE 8080

CMD ["/opt/tomcat/bin/catalina.sh", "run"]
