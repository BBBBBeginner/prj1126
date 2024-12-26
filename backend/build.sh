rm -rf src/main/resources/static

cd ../frontend
npm run build

mv dist ../backend/src/main/resources/static

cd ../backend

./gradlew bootJar

scp -i src/main/resources/secret/key1226.pem build/libs/backend-0.0.1-SNAPSHOT.jar ubuntu@13.125.232.120:./prj.jar
ssh -i src/main/resources/secret/key1226.pem ubuntu@13.125.232.120 './run.sh'