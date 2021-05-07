
pipeline {
    agent any

      environment {
        DHIS2_CORE_GIT_REPO = 'https://github.com/dhis2/dhis2-core.git'
        DHIS2_CORE_KS_BRANCH = '2.36-ks-tracker'

        IMAGE_NAME = "fiks-dhis2-tracker-capture-app"
    }

    tools {
        maven 'maven'
        jdk 'openjdk11'
        nodejs "node-LTS"
    }

    parameters {
        booleanParam(defaultValue: false, description: 'Skal prosjektet releases?', name: 'isRelease')
        string(name: "releaseVersion", defaultValue: "", description: "Hva er det nye versjonsnummeret?")
        string(name: "snapshotVersion", defaultValue: "", description: "Hva er den nye snapshotversjonen? (uten -SNAPSHOT postfix)")
    }

    stages {

        stage('Resolve version') {
            steps {
                script {
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse HEAD').substring(0, 7)
                    env.WORKSPACE = pwd()
                    env.CURRENT_VERSION = readFile "${env.WORKSPACE}/version"
                    env.CURRENT_VERSION = env.CURRENT_VERSION.replace("SNAPSHOT", env.GIT_SHA)
                    env.IMAGE_TAG = env.CURRENT_VERSION
                }
            }
        }

        stage('check tools') {
            steps {
                sh "node -v"
                sh "npm -v"
            }
        }

        stage('Build tracker capture app') {
            steps {
                script {
                    sh "npm install"
                    sh "npm run build"
                }
            }
        }
        stage('Build dhis'){
            steps {
                dir('dhis2-core') {
                    git branch: "${DHIS2_CORE_KS_BRANCH}",
                    url: "${DHIS2_CORE_GIT_REPO}"
                    script {
                        sh "mvn clean install -f dhis-2/pom.xml -DskipTests"
                        sh "mvn clean install -U -f dhis-2/dhis-web/pom.xml -DskipTests"
                    }
                }
            }
        }
        stage('Repackage war with KS tracker capture app') {
            when {
                branch 'main'
            }
            steps {
                dir('war-content') {

                    script {
                        def tracker_capture_path = "dhis-web-tracker-capture"
                        def docker_artifacts_path = "../dhis2-core/docker/artifacts/"
                        def war_file = "dhis.war"

                        sh "jar -xvf ../dhis2-core/dhis-2/dhis-web/dhis-web-portal/target/${war_file}"
                        sh "rm -rf ${tracker_capture_path}/*"
                        sh "mv ../build/* ${tracker_capture_path}/"
                        sh "jar -cvf ${war_file} *"
                        sh "mv ${war_file} ../${war_file}"
                    }
                }
            }
        }

        stage('Push image') {
            steps {
                script {
                    buildAndPushDockerImage(IMAGE_NAME, [env.CURRENT_VERSION, 'latest'], [], params.isRelease)
                }
            }
        }
    }
}