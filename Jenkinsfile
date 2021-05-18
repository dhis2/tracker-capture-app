
pipeline {
    agent {
        label 'linux-large'
    }

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
            steps {
                dir('war-content') {

                    script {
                        def tracker_capture_path = "dhis-web-tracker-capture"
                        def docker_artifacts_path = "../dhis2-core/docker/artifacts/"
                        def war_file_name = "dhis.war"

                        sh "jar -xvf ../dhis2-core/dhis-2/dhis-web/dhis-web-portal/target/${war_file_name}"
                        sh "rm -rf ${tracker_capture_path}/*"
                        sh "mv ../build/* ${tracker_capture_path}/"
                        sh "jar -cvf ${war_file_name} *"
                        sh "mv ${war_file_name} ../docker/${war_file_name}"
                    }
                }
            }
        }

        stage('Push image') {
            steps {
                script {
                    buildAndPushDockerImage(IMAGE_NAME, [env.CURRENT_VERSION, 'latest'], [], false, 'docker')
                }
            }
        }

        stage('Deploy to dev') {
            when {
                branch 'main'
            }
            steps {
                build job: 'KS/fiks-dhis2-configuration/main', parameters: [string(name: 'tag', value: env.CURRENT_VERSION)], wait: false, propagate: false
            }
       }
    }
}