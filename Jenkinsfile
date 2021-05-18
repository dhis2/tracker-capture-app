
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

        stage('Deploy to dev') {
            steps {
                build job: 'KS/fiks-dhis2-configuration/main', parameters: [string(name: 'tag', value: 'latest')], wait: false, propagate: false
            }
       }
    }
}