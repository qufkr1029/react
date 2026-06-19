pipeline {
    agent any

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref']
            ],
            tokenCredentialId: 'react-webhook-token',
            causeString: 'Triggered by GitHub push to $ref',
            regexpFilterText: '$ref',
            regexpFilterExpression: 'refs/heads/main',
            printContributedVariables: true,
            printPostContent: true
        )
    }

    environment {
        DEPLOY_DIR = '/var/jenkins_home/projects/react'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    echo 'Building Docker Image for React...'
                    sh 'docker build -t react-app .'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo 'Deploying application using Docker Compose...'
                    sh "mkdir -p ${DEPLOY_DIR}"
                    sh """
                        cd ${DEPLOY_DIR}
                        docker compose down || true
                    """
                    sh "cp docker-compose.yml ${DEPLOY_DIR}/"
                    sh """
                        cd ${DEPLOY_DIR}
                        docker compose up -d
                    """
                }
            }
        }

        stage('Clean Up') {
            steps {
                script {
                    echo 'Cleaning up unused Docker images...'
                    sh 'docker image prune -f'
                }
            }
        }
    }
}
